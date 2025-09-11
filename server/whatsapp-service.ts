import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  ConnectionState,
  WAMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode-terminal';
import P from 'pino';
import fs from 'fs';
import path from 'path';

// Logger configuration
const logger = P({ level: 'silent' });

// Message storage interface
interface StoredMessage {
  id: string;
  to: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
  studentName?: string;
  grade?: string;
}

class WhatsAppService {
  private sock: any = null;
  private isConnected = false;
  private qrCode: string | null = null;
  private connectionState: string = 'disconnected';
  private messagesFile = path.join(process.cwd(), 'data', 'whatsapp-messages.json');

  constructor() {
    this.ensureDataDirectory();
  }

  private ensureDataDirectory() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Initialize messages file if it doesn't exist
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
      console.error('Error saving message:', error);
    }
  }

  getStoredMessages(): StoredMessage[] {
    try {
      const data = fs.readFileSync(this.messagesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading stored messages:', error);
      return [];
    }
  }

  updateMessageStatus(messageId: string, status: 'sent' | 'failed') {
    try {
      const messages = this.getStoredMessages();
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        messages[messageIndex].status = status;
        fs.writeFileSync(this.messagesFile, JSON.stringify(messages, null, 2));
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  async connect(): Promise<void> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ['Student Grading System', 'Desktop', '1.0.0']
      });

      this.sock.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          this.qrCode = qr;
          console.log('QR Code updated');
          // Generate QR code for terminal (optional)
          QRCode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
          
          this.isConnected = false;
          this.connectionState = 'disconnected';
          
          if (shouldReconnect) {
            this.connect();
          }
        } else if (connection === 'open') {
          console.log('WhatsApp connection opened successfully');
          this.isConnected = true;
          this.connectionState = 'connected';
          this.qrCode = null;
        }

        this.connectionState = connection || 'disconnected';
      });

      this.sock.ev.on('creds.update', saveCreds);
      
    } catch (error) {
      console.error('Error connecting to WhatsApp:', error);
      this.connectionState = 'error';
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      state: this.connectionState,
      qrCode: this.qrCode
    };
  }

  async sendMessage(phoneNumber: string, message: string, studentName?: string, grade?: string): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store message locally first
    const storedMessage: StoredMessage = {
      id: messageId,
      to: phoneNumber,
      message,
      timestamp: new Date().toISOString(),
      status: 'pending',
      studentName,
      grade
    };
    
    this.saveMessage(storedMessage);

    if (!this.isConnected || !this.sock) {
      console.log('WhatsApp not connected, message saved for later');
      return messageId;
    }

    try {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      
      await this.sock.sendMessage(jid, { text: message });
      console.log(`Message sent to ${phoneNumber}: ${message}`);
      
      this.updateMessageStatus(messageId, 'sent');
      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      this.updateMessageStatus(messageId, 'failed');
      throw error;
    }
  }

  async sendGradeMessage(studentName: string, phoneNumber: string, grade: string, subject: string = 'الامتحان') {
    const message = `📊 نتيجة ${subject}

👤 اسم الطالب: ${studentName}
📝 الدرجة: ${grade}
📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}

📞 للاستفسار يرجى التواصل مع إدارة المدرسة

🌟 نتمنى للطالب دوام التفوق والنجاح`;

    return await this.sendMessage(phoneNumber, message, studentName, grade);
  }

  downloadMessagesAsJSON(): Buffer {
    const messages = this.getStoredMessages();
    return Buffer.from(JSON.stringify(messages, null, 2));
  }

  downloadMessagesAsCSV(): Buffer {
    const messages = this.getStoredMessages();
    const headers = ['ID', 'Student Name', 'Phone', 'Grade', 'Message', 'Status', 'Timestamp'];
    
    let csvContent = headers.join(',') + '\n';
    
    messages.forEach(msg => {
      const row = [
        msg.id,
        msg.studentName || '',
        msg.to,
        msg.grade || '',
        `"${msg.message.replace(/"/g, '""')}"`,
        msg.status,
        msg.timestamp
      ];
      csvContent += row.join(',') + '\n';
    });
    
    return Buffer.from(csvContent);
  }

  async sendStoredMessage(messageId: string): Promise<boolean> {
    const messages = this.getStoredMessages();
    const message = messages.find(m => m.id === messageId);
    
    if (!message || message.status !== 'pending') {
      return false;
    }

    if (!this.isConnected || !this.sock) {
      return false;
    }

    try {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = message.to.replace(/[^\d+]/g, '');
      const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      
      await this.sock.sendMessage(jid, { text: message.message });
      console.log(`Message sent to ${message.to}: ${message.message}`);
      
      this.updateMessageStatus(messageId, 'sent');
      return true;
    } catch (error) {
      console.error('Error sending stored message:', error);
      this.updateMessageStatus(messageId, 'failed');
      return false;
    }
  }

  async sendAllPendingMessages(): Promise<{sent: number, failed: number, total: number}> {
    const messages = this.getStoredMessages();
    const pendingMessages = messages.filter(m => m.status === 'pending');
    
    let sent = 0;
    let failed = 0;

    if (!this.isConnected || !this.sock) {
      return { sent: 0, failed: pendingMessages.length, total: pendingMessages.length };
    }

    for (const message of pendingMessages) {
      try {
        const success = await this.sendStoredMessage(message.id);
        if (success) {
          sent++;
        } else {
          failed++;
        }
        // Add a small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        console.error('Error sending message in batch:', error);
      }
    }

    return { sent, failed, total: pendingMessages.length };
  }

  clearMessages() {
    fs.writeFileSync(this.messagesFile, JSON.stringify([], null, 2));
  }

  disconnect() {
    if (this.sock) {
      this.sock.end();
      this.sock = null;
    }
    this.isConnected = false;
    this.connectionState = 'disconnected';
    this.qrCode = null;
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();