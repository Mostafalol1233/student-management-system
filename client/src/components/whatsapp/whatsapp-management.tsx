import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  QrCode, 
  MessageCircle, 
  Download, 
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send
} from 'lucide-react';

interface WhatsAppStatus {
  isConnected: boolean;
  state: string;
  qrCode?: string;
}

interface StoredMessage {
  id: string;
  to: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
  studentName?: string;
  grade?: string;
}

export function WhatsAppManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [qrCodeVisible, setQrCodeVisible] = useState(false);

  // Get WhatsApp status
  const { data: status, isLoading: statusLoading } = useQuery<WhatsAppStatus>({
    queryKey: ['/api/whatsapp/status'],
    refetchInterval: 3000 // Check status every 3 seconds
  });

  // Get stored messages
  const { data: messages = [], refetch: refetchMessages } = useQuery<StoredMessage[]>({
    queryKey: ['/api/whatsapp/messages']
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/whatsapp/connect'),
    onSuccess: () => {
      toast({
        title: "اتصال WhatsApp",
        description: "تم بدء عملية الاتصال بنجاح",
      });
      setQrCodeVisible(true);
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/status'] });
    },
    onError: () => {
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في بدء اتصال WhatsApp",
        variant: "destructive"
      });
    }
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/whatsapp/disconnect'),
    onSuccess: () => {
      toast({
        title: "قطع اتصال WhatsApp",
        description: "تم قطع الاتصال بنجاح",
      });
      setQrCodeVisible(false);
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/status'] });
    }
  });

  // Clear messages mutation
  const clearMessagesMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/whatsapp/messages'),
    onSuccess: () => {
      toast({
        title: "حذف الرسائل",
        description: "تم حذف جميع الرسائل المحفوظة",
      });
      refetchMessages();
    }
  });

  // Send individual message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageId: string) => apiRequest('POST', `/api/whatsapp/send-message/${messageId}`),
    onSuccess: () => {
      toast({
        title: "إرسال الرسالة",
        description: "تم إرسال الرسالة بنجاح",
      });
      refetchMessages();
    },
    onError: () => {
      toast({
        title: "خطأ في الإرسال",
        description: "فشل في إرسال الرسالة",
        variant: "destructive"
      });
    }
  });

  // Send all messages mutation
  const sendAllMessagesMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/whatsapp/send-all'),
    onSuccess: () => {
      toast({
        title: "إرسال جميع الرسائل",
        description: "تم إرسال جميع الرسائل المعلقة بنجاح",
      });
      refetchMessages();
    },
    onError: () => {
      toast({
        title: "خطأ في الإرسال",
        description: "فشل في إرسال بعض الرسائل",
        variant: "destructive"
      });
    }
  });

  // Auto-hide QR code when connected
  useEffect(() => {
    if (status?.isConnected) {
      setQrCodeVisible(false);
    }
  }, [status?.isConnected]);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'connected':
      case 'open':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'close':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportMessages = (format: 'json' | 'csv') => {
    const url = `/api/whatsapp/messages/export?format=${format}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `whatsapp-messages.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingMessages = messages.filter(m => m.status === 'pending').length;
  const sentMessages = messages.filter(m => m.status === 'sent').length;
  const failedMessages = messages.filter(m => m.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">إدارة WhatsApp</h2>
              <p className="text-gray-600">إرسال الدرجات عبر رسائل WhatsApp</p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              حالة الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                جاري التحقق من الحالة...
              </div>
            ) : status ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status.state)}`}></div>
                  <Badge variant={status.isConnected ? "default" : "secondary"}>
                    {status.isConnected ? (
                      <>
                        <Wifi className="w-4 h-4 mr-1" />
                        متصل
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 mr-1" />
                        غير متصل
                      </>
                    )}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    الحالة: {status.state}
                  </span>
                </div>

                <div className="flex gap-2">
                  {!status.isConnected ? (
                    <Button 
                      onClick={() => connectMutation.mutate()}
                      disabled={connectMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-whatsapp-connect"
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      اتصال WhatsApp
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      variant="destructive"
                      data-testid="button-whatsapp-disconnect"
                    >
                      <WifiOff className="w-4 h-4 mr-2" />
                      قطع الاتصال
                    </Button>
                  )}
                </div>

                {/* QR Code Section */}
                {status.qrCode && qrCodeVisible && (
                  <Alert>
                    <QrCode className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <p>امسح QR Code باستخدام WhatsApp على هاتفك:</p>
                        <div className="bg-white p-4 rounded-lg inline-block">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(status.qrCode)}`}
                            alt="WhatsApp QR Code"
                            className="w-48 h-48"
                          />
                        </div>
                        <p className="text-sm text-gray-600">
                          افتح WhatsApp على هاتفك ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  فشل في الحصول على حالة الاتصال
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Messages Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              إحصائيات الرسائل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{sentMessages}</div>
                <div className="text-sm text-gray-600">تم الإرسال</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{pendingMessages}</div>
                <div className="text-sm text-gray-600">في الانتظار</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{failedMessages}</div>
                <div className="text-sm text-gray-600">فشل</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              الرسائل المحفوظة ({messages.length})
            </div>
            <div className="flex gap-2">
              {status?.isConnected && pendingMessages > 0 && (
                <Button
                  size="sm"
                  onClick={() => sendAllMessagesMutation.mutate()}
                  disabled={sendAllMessagesMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-send-all"
                >
                  <Send className="w-4 h-4 mr-1" />
                  إرسال الكل ({pendingMessages})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMessages('json')}
                data-testid="button-export-json"
              >
                <Download className="w-4 h-4 mr-1" />
                تصدير JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMessages('csv')}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-1" />
                تصدير CSV
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => clearMessagesMutation.mutate()}
                disabled={clearMessagesMutation.isPending || messages.length === 0}
                data-testid="button-clear-messages"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                حذف الكل
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد رسائل محفوظة
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 border rounded-lg bg-gray-50"
                  data-testid={`message-${message.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(message.status)}
                        <span className="font-medium">{message.studentName || 'غير محدد'}</span>
                        <span className="text-sm text-gray-500">{message.to}</span>
                        {message.grade && (
                          <Badge variant="outline">الدرجة: {message.grade}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {message.message}
                      </p>
                      <div className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString('ar-EG')}
                      </div>
                    </div>
                    {/* Individual Send Button */}
                    {message.status === 'pending' && status?.isConnected && (
                      <div className="mr-4">
                        <Button
                          size="sm"
                          onClick={() => sendMessageMutation.mutate(message.id)}
                          disabled={sendMessageMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                          data-testid={`button-send-${message.id}`}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          إرسال
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}