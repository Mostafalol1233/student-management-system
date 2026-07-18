import fs from "fs";
import path from "path";

// Message storage interface
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

/**
 * WhatsAppService
 *
 * Manages outgoing WhatsApp message queueing and persistent storage.
 * The live socket integration requires @whiskeysockets/baileys which depends
 * on protobufjs — currently blocked by the security policy. All message
 * data is persisted to disk so no history is lost on restart. Live sending
 * can be re-enabled by restoring the Baileys import once the security issue
 * is resolved.
 */
class WhatsAppService {
  private isConnected = false;
  private qrCode: string | null = null;
  private connectionState: string = "disconnected";
  private messagesFile = path.join(process.cwd(), "data", "whatsapp-messages.json");

  constructor() {
    this.ensureDataDirectory();
  }

  private ensureDataDirectory() {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.messagesFile)) {
      fs.writeFileSync(this.messagesFile, JSON.stringify([], null, 2));
    }
  }

  private saveMessage(message: StoredMessage) {
    try {
      const messages = this.getStoredMessages();
      messages.push(message);
      fs.writeFileSync(this.messagesFile, JSON.stringify(messages, null, 2));
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }

  getStoredMessages(): StoredMessage[] {
    try {
      const data = fs.readFileSync(this.messagesFile, "utf8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  updateMessageStatus(messageId: string, status: "sent" | "failed") {
    try {
      const messages = this.getStoredMessages();
      const idx = messages.findIndex(m => m.id === messageId);
      if (idx !== -1) {
        messages[idx].status = status;
        fs.writeFileSync(this.messagesFile, JSON.stringify(messages, null, 2));
      }
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  }

  // ── Connection ─────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    // Live WhatsApp socket is disabled — see class docstring.
    console.warn(
      "[WhatsApp] Live connection unavailable. " +
      "Messages will be queued and can be sent once the Baileys dependency is unblocked."
    );
    this.connectionState = "disconnected";
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      state: this.connectionState,
      qrCode: this.qrCode,
    };
  }

  disconnect() {
    this.isConnected = false;
    this.connectionState = "disconnected";
    this.qrCode = null;
  }

  // ── Sending ────────────────────────────────────────────────────────────────

  async sendMessage(
    phoneNumber: string,
    message: string,
    studentName?: string,
    grade?: string
  ): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storedMessage: StoredMessage = {
      id: messageId,
      to: phoneNumber,
      message,
      timestamp: new Date().toISOString(),
      status: "pending",
      studentName,
      grade,
    };
    this.saveMessage(storedMessage);
    console.log(`[WhatsApp] Message queued (${messageId}) → ${phoneNumber}`);
    return messageId;
  }

  async sendGradeMessage(
    studentName: string,
    phoneNumber: string,
    grade: string,
    subject = "الامتحان",
    notes?: string
  ) {
    let message = `📊 نتيجة ${subject}\n\n👤 اسم الطالب: ${studentName}\n📝 الدرجة: ${grade}\n📅 التاريخ: ${new Date().toLocaleDateString("ar-EG")}`;
    if (notes) message += `\n\n💬 ملاحظات المعلم:\n${notes}`;
    message += `\n\n📞 للاستفسار يرجى التواصل مع إدارة المدرسة\n\n🌟 نتمنى للطالب دوام التفوق والنجاح`;
    return await this.sendMessage(phoneNumber, message, studentName, grade);
  }

  async getGroups(): Promise<GroupInfo[]> {
    return [];
  }

  async sendGroupMessage(
    groupId: string,
    message: string,
    _mentionAll = false,
    groupName?: string
  ): Promise<string> {
    const messageId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storedMessage: StoredMessage = {
      id: messageId,
      to: groupId,
      message,
      timestamp: new Date().toISOString(),
      status: "pending",
      isGroupMessage: true,
      groupId,
      groupName,
    };
    this.saveMessage(storedMessage);
    return messageId;
  }

  async mentionAllInGroup(groupId: string, message: string, groupName?: string): Promise<string> {
    return await this.sendGroupMessage(groupId, message, true, groupName);
  }

  async sendStoredMessage(messageId: string): Promise<boolean> {
    const messages = this.getStoredMessages();
    const message = messages.find(m => m.id === messageId);
    if (!message || message.status !== "pending") return false;
    // No live socket — mark as pending and return false
    console.log(`[WhatsApp] Cannot send ${messageId} — not connected`);
    return false;
  }

  async sendAllPendingMessages(): Promise<{ sent: number; failed: number; total: number }> {
    const messages = this.getStoredMessages();
    const pending = messages.filter(m => m.status === "pending");
    return { sent: 0, failed: pending.length, total: pending.length };
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  downloadMessagesAsJSON(): Buffer {
    return Buffer.from(JSON.stringify(this.getStoredMessages(), null, 2));
  }

  downloadMessagesAsCSV(): Buffer {
    const messages = this.getStoredMessages();
    const headers = ["ID", "Student Name", "Phone", "Grade", "Message", "Status", "Timestamp"];
    let csv = headers.join(",") + "\n";
    messages.forEach(msg => {
      csv += [
        msg.id,
        msg.studentName || "",
        msg.to,
        msg.grade || "",
        `"${msg.message.replace(/"/g, '""')}"`,
        msg.status,
        msg.timestamp,
      ].join(",") + "\n";
    });
    return Buffer.from(csv);
  }

  clearMessages() {
    fs.writeFileSync(this.messagesFile, JSON.stringify([], null, 2));
  }
}

export const whatsappService = new WhatsAppService();
