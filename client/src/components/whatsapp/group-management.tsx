import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  MessageSquare, 
  AtSign, 
  Send,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface GroupInfo {
  id: string;
  name: string;
  participantsCount: number;
  lastMessageTime?: string;
}

export function GroupManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);
  const [message, setMessage] = useState('');

  // Get WhatsApp groups
  const { data: groups = [], isLoading, refetch: refetchGroups } = useQuery<GroupInfo[]>({
    queryKey: ['/api/whatsapp/groups'],
    retry: 1
  });

  // Send group message mutation
  const sendGroupMessageMutation = useMutation({
    mutationFn: async ({ groupId, message, mentionAll, groupName }: {
      groupId: string;
      message: string;
      mentionAll: boolean;
      groupName: string;
    }) => {
      return apiRequest('POST', '/api/whatsapp/send-group-message', {
        groupId,
        message,
        mentionAll,
        groupName
      });
    },
    onSuccess: () => {
      toast({
        title: "إرسال رسالة المجموعة",
        description: "تم إرسال الرسالة للمجموعة بنجاح",
      });
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/messages'] });
    },
    onError: () => {
      toast({
        title: "خطأ في الإرسال",
        description: "فشل في إرسال رسالة المجموعة",
        variant: "destructive"
      });
    }
  });

  // Mention all mutation
  const mentionAllMutation = useMutation({
    mutationFn: async ({ groupId, message, groupName }: {
      groupId: string;
      message: string;
      groupName: string;
    }) => {
      return apiRequest('POST', '/api/whatsapp/mention-all', {
        groupId,
        message,
        groupName
      });
    },
    onSuccess: () => {
      toast({
        title: "منشن جماعي",
        description: "تم إرسال المنشن الجماعي بنجاح",
      });
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/messages'] });
    },
    onError: () => {
      toast({
        title: "خطأ في المنشن",
        description: "فشل في إرسال المنشن الجماعي",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = (mentionAll: boolean = false) => {
    if (!selectedGroup || !message.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مجموعة وكتابة رسالة",
        variant: "destructive"
      });
      return;
    }

    if (mentionAll) {
      mentionAllMutation.mutate({
        groupId: selectedGroup.id,
        message: message.trim(),
        groupName: selectedGroup.name
      });
    } else {
      sendGroupMessageMutation.mutate({
        groupId: selectedGroup.id,
        message: message.trim(),
        mentionAll: false,
        groupName: selectedGroup.name
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">إدارة المجموعات</h2>
              <p className="text-gray-600">إرسال رسائل ومنشن جماعي للمجموعات</p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Groups List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                المجموعات المتاحة ({groups.length})
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchGroups()}
                disabled={isLoading}
                data-testid="button-refresh-groups"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-2" />
                <p className="text-gray-500">جاري تحميل المجموعات...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">لا توجد مجموعات متاحة</p>
                <p className="text-sm text-gray-400 mt-1">تأكد من ربط WhatsApp أولاً</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedGroup(group)}
                    data-testid={`group-${group.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {group.participantsCount} عضو
                          </Badge>
                        </div>
                      </div>
                      {selectedGroup?.id === group.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Composer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              إرسال رسالة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedGroup ? (
              <>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">
                    <strong>المجموعة المختارة:</strong> {selectedGroup.name}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    {selectedGroup.participantsCount} عضو
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">نص الرسالة:</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="min-h-32"
                    data-testid="textarea-group-message"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSendMessage(false)}
                    disabled={!message.trim() || sendGroupMessageMutation.isPending}
                    className="flex-1"
                    data-testid="button-send-group-message"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    إرسال رسالة عادية
                  </Button>
                  <Button
                    onClick={() => handleSendMessage(true)}
                    disabled={!message.trim() || mentionAllMutation.isPending}
                    variant="secondary"
                    className="flex-1"
                    data-testid="button-mention-all"
                  >
                    <AtSign className="w-4 h-4 mr-2" />
                    منشن جماعي
                  </Button>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  <p><strong>رسالة عادية:</strong> سيتم إرسال الرسالة للمجموعة بدون منشن</p>
                  <p><strong>منشن جماعي:</strong> سيتم منشن جميع أعضاء المجموعة</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">اختر مجموعة من القائمة لإرسال رسالة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}