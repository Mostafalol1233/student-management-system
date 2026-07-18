import fs from "fs";
import path from "path";

// ── Types ──────────────────────────────────────────────────────────────────

interface StoredMessage {
  id: string;
  to: string;
  message: string;
  timestamp: string;
  status: "pending" | "sent" | "failed";
  studentName?: string;
  grade?: string;
  isGroupMessage?: boolean;
  groupId?: string;
  groupName?: string;
}

interface GroupInfo {
  id: string;
  name: string;
  participantsCount: number;
  lastMessageTime?: string;
}

// ── WhatsApp Service ───────────────────────────────────────────────────────

class WhatsAppService {
  private sock: any = null;
  private isConnected = false;
  private qrCode: string | null = null;
  private connectionState: string = "disconnected";
  private messagesFile = path.join(process.cwd(), "data", "whatsapp-messages.json");
  private authDir = path.join(process.cwd(), "data", "whatsapp-auth");

  constructor() {
    this.ensureDataDirectory();
  }

  private ensureDataDirectory() {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(this.authDir)) fs.mkdirSync(this.authDir, { recursive: true });
    if (!fs.existsSync(this.messagesFile))
      fs.writeFileSync(this.messagesFile, JSON.stringify([], null, 2));
  }

  // ── Connection ────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.isConnected) return;
    this.connectionState = "connecting";
    this.qrCode = null;

    try {
      const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        Browsers,
      } = await import("@whiskeysockets/baileys");

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      this.sock = makeWASocket({
        auth: state,
        browser: Browsers.ubuntu("Chrome"),
        printQRInTerminal: false,
        logger: { level: "silent", trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => ({ level: "silent", trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, child: () => ({} as any) }) },
      });

      this.sock.ev.on("connection.update", (update: any) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
          this.qrCode = qr;
          this.connectionState = "qr_ready";
          console.log("[WhatsApp] QR ready — scan with your phone");
        }
        if (connection === "close") {
          const shouldReconnect =
            (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
          this.isConnected = false;
          this.connectionState = "disconnected";
          if (shouldReconnect) {
            console.log("[WhatsApp] Reconnecting...");
            setTimeout(() => this.connect(), 3000);
          } else {
            console.log("[WhatsApp] Logged out — clearing auth");
            this.clearAuth();
          }
        }
        if (connection === "open") {
          this.isConnected = true;
          this.qrCode = null;
          this.connectionState = "connected";
          console.log("[WhatsApp] ✅ Connected!");
        }
      });

      this.sock.ev.on("creds.update", saveCreds);
    } catch (err: any) {
      console.error("[WhatsApp] Failed to initialise:", err.message);
      this.connectionState = "error";
    }
  }

  private clearAuth() {
    try {
      fs.rmSync(this.authDir, { recursive: true, force: true });
      fs.mkdirSync(this.authDir, { recursive: true });
    } catch {}
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      state: this.connectionState,
      qrCode: this.qrCode,
    };
  }

  disconnect() {
    if (this.sock) {
      try { this.sock.end(undefined); } catch {}
      this.sock = null;
    }
    this.isConnected = false;
    this.connectionState = "disconnected";
    this.qrCode = null;
  }

  // ── Storage helpers ───────────────────────────────────────────────────────

  private saveMessage(msg: StoredMessage) {
    try {
      const msgs = this.getStoredMessages();
      msgs.push(msg);
      fs.writeFileSync(this.messagesFile, JSON.stringify(msgs, null, 2));
    } catch (e) { console.error("[WhatsApp] Error saving message:", e); }
  }

  getStoredMessages(): StoredMessage[] {
    try {
      return JSON.parse(fs.readFileSync(this.messagesFile, "utf8"));
    } catch { return []; }
  }

  updateMessageStatus(messageId: string, status: "sent" | "failed") {
    try {
      const msgs = this.getStoredMessages();
      const idx = msgs.findIndex(m => m.id === messageId);
      if (idx !== -1) { msgs[idx].status = status; fs.writeFileSync(this.messagesFile, JSON.stringify(msgs, null, 2)); }
    } catch {}
  }

  // ── Sending ───────────────────────────────────────────────────────────────

  private normalisePhone(phone: string): string {
    // Strip non-digits, prepend country code if missing
    const digits = phone.replace(/\D/g, "");
    const num = digits.startsWith("0") ? "20" + digits.slice(1) : digits;
    return num + "@s.whatsapp.net";
  }

  async sendMessage(phone: string, message: string, studentName?: string, grade?: string): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const stored: StoredMessage = {
      id: messageId, to: phone, message,
      timestamp: new Date().toISOString(), status: "pending",
      studentName, grade,
    };
    this.saveMessage(stored);

    if (!this.isConnected || !this.sock) {
      console.log(`[WhatsApp] Queued (not connected) → ${phone}`);
      return messageId;
    }

    try {
      const jid = this.normalisePhone(phone);
      await this.sock.sendMessage(jid, { text: message });
      this.updateMessageStatus(messageId, "sent");
      console.log(`[WhatsApp] ✅ Sent → ${phone}`);
    } catch (err: any) {
      this.updateMessageStatus(messageId, "failed");
      console.error(`[WhatsApp] ❌ Failed → ${phone}:`, err.message);
    }

    return messageId;
  }

  async sendGradeMessage(
    studentName: string, phone: string, grade: string, subject = "الامتحان", notes?: string
  ) {
    let msg = `📊 نتيجة ${subject}\n\n👤 اسم الطالب: ${studentName}\n📝 الدرجة: ${grade}\n📅 التاريخ: ${new Date().toLocaleDateString("ar-EG")}`;
    if (notes) msg += `\n\n💬 ملاحظات المعلم:\n${notes}`;
    msg += `\n\n📞 للاستفسار يرجى التواصل مع إدارة المدرسة\n\n🌟 نتمنى للطالب دوام التفوق والنجاح`;
    return await this.sendMessage(phone, msg, studentName, grade);
  }

  async getGroups(): Promise<GroupInfo[]> {
    if (!this.isConnected || !this.sock) return [];
    try {
      const groupsMeta = await this.sock.groupFetchAllParticipating();
      return Object.values(groupsMeta).map((g: any) => ({
        id: g.id, name: g.subject,
        participantsCount: g.participants?.length ?? 0,
      }));
    } catch { return []; }
  }

  async sendGroupMessage(groupId: string, message: string, _mentionAll = false, groupName?: string): Promise<string> {
    const messageId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const stored: StoredMessage = {
      id: messageId, to: groupId, message,
      timestamp: new Date().toISOString(), status: "pending",
      isGroupMessage: true, groupId, groupName,
    };
    this.saveMessage(stored);

    if (!this.isConnected || !this.sock) {
      console.log(`[WhatsApp] Group message queued (not connected) → ${groupId}`);
      return messageId;
    }

    try {
      const jid = groupId.includes("@g.us") ? groupId : `${groupId}@g.us`;
      await this.sock.sendMessage(jid, { text: message });
      this.updateMessageStatus(messageId, "sent");
    } catch (err: any) {
      this.updateMessageStatus(messageId, "failed");
    }

    return messageId;
  }

  async sendAllPendingMessages(): Promise<{ sent: number; failed: number; total: number }> {
    const pending = this.getStoredMessages().filter(m => m.status === "pending");
    let sent = 0; let failed = 0;
    for (const msg of pending) {
      try {
        if (!this.isConnected || !this.sock) { failed++; continue; }
        const jid = msg.isGroupMessage
          ? (msg.groupId!.includes("@g.us") ? msg.groupId! : `${msg.groupId}@g.us`)
          : this.normalisePhone(msg.to);
        await this.sock.sendMessage(jid, { text: msg.message });
        this.updateMessageStatus(msg.id, "sent"); sent++;
      } catch { this.updateMessageStatus(msg.id, "failed"); failed++; }
    }
    return { sent, failed, total: pending.length };
  }

  // ── Export ────────────────────────────────────────────────────────────────

  downloadMessagesAsJSON = () => Buffer.from(JSON.stringify(this.getStoredMessages(), null, 2));

  downloadMessagesAsCSV() {
    const msgs = this.getStoredMessages();
    let csv = "ID,Student Name,Phone,Grade,Message,Status,Timestamp\n";
    msgs.forEach(m => {
      csv += [m.id, m.studentName || "", m.to, m.grade || "", `"${m.message.replace(/"/g, '""')}"`, m.status, m.timestamp].join(",") + "\n";
    });
    return Buffer.from(csv);
  }

  clearMessages() { fs.writeFileSync(this.messagesFile, JSON.stringify([], null, 2)); }
}

export const whatsappService = new WhatsAppService();
