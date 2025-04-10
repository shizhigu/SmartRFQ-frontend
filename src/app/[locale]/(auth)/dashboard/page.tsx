'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@clerk/nextjs';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  Clock, 
  Inbox, 
  Mail, 
  FileText, 
  Send, 
  Archive, 
  Star, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Reply, 
  Forward, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronUp,
  Plus,
  LineChart
} from 'lucide-react';

import { useApiWithOrganization, API_BASE_URL, createRequestOptions } from '@/utils/api';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/utils/Helpers";
import { useProject } from '@/contexts/ProjectContext';

// 数据类型定义
interface EmailHistory {
  id: string;
  project_id: string;
  conversation_id: string | null;
  to_email: string;
  subject: string;
  content: string | null;
  status: string;
  sent_at: string | null;
  rfq_items: string[] | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

// 添加仪表盘统计数据接口
interface DashboardStats {
  activeProjects: number;
  monthlyEmails: number;
  supplierCount: number;
  pendingQuotes: number;
}

// 邮件项组件 - 用于显示单个邮件，支持内容展开/折叠
function EmailItem({ 
  email, 
  onReply, 
  onForward 
}: { 
  email: EmailHistory; 
  onReply?: (email: EmailHistory) => void;
  onForward?: (email: EmailHistory) => void;
}) {
  // 为每个邮件创建独立的展开状态
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hasLongContent = email.content && email.content.length > 100;
  
  // 处理回复邮件
  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发内容区域的点击事件
    if (onReply) {
      onReply(email);
    }
  };
  
  // 处理转发邮件
  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onForward) {
      onForward(email);
    }
  };
  
  return (
    <Card 
      className="overflow-hidden border-l-4 transition-all duration-200 hover:shadow-md group"
      style={{ 
        borderLeftColor: email.status === 'sent' ? 'var(--primary)' : 'var(--destructive)' 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-3 pb-1.5 bg-muted/30 flex flex-row items-center justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">{email.subject}</CardTitle>
            <Badge 
              variant={email.status === 'sent' ? 'default' : 'destructive'}
              className="text-[10px] py-0 px-1.5 h-4"
            >
              {email.status === 'sent' ? '已发送' : '发送失败'}
            </Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            收件人: {email.to_email}
          </CardDescription>
        </div>
        <div className="text-xs text-muted-foreground">
          {email.sent_at ? format(new Date(email.sent_at), 'yyyy-MM-dd HH:mm') : '未发送'}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* 邮件内容区域 */}
        <div 
          className={cn(
            "text-sm p-3 transition-all duration-300 cursor-pointer",
            hasLongContent && !isExpanded ? "max-h-[80px]" : "max-h-[600px]",
            "overflow-hidden relative"
          )}
          onClick={() => hasLongContent && setIsExpanded(!isExpanded)}
        >
          <div className="whitespace-pre-wrap break-words">
            {email.content}
          </div>
          
          {/* 渐变遮罩和展开提示 */}
          {hasLongContent && !isExpanded && (
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-1">
              <div className="text-xs text-primary font-medium flex items-center">
                <ChevronDown className="h-3 w-3 mr-1" />
                点击展开
              </div>
            </div>
          )}
        </div>
        
        {/* 交互操作栏 */}
        <div className={cn(
          "flex justify-end items-center px-3 py-1.5 bg-muted/20 border-t border-border/50 text-xs text-muted-foreground",
          "transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {hasLongContent && isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs mr-auto"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
            >
              <ChevronUp className="h-3 w-3 mr-1" />
              收起
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              title="回复邮件"
              onClick={handleReply}
            >
              <Reply className="h-3 w-3 mr-1" />
              回复
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              title="转发邮件"
              onClick={handleForward}
            >
              <Forward className="h-3 w-3 mr-1" />
              转发
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              title="更多操作"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 项目卡片组件
function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge
            variant={
              project.status === 'open' ? 'default' :
              project.status === 'closed' ? 'destructive' :
              project.status === 'archived' ? 'secondary' : 'outline'
            }
            className="text-xs"
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {project.description || '无描述信息'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-xs text-muted-foreground mb-2">
          创建于: {format(new Date(project.created_at), 'yyyy-MM-dd')}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/dashboard/projects/${project.id}`}>查看详情</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// 活动项组件
function ActivityItem({ 
  icon, 
  title, 
  description, 
  time,
  color = "bg-muted text-muted-foreground"
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  time: string;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className={`rounded-full p-2 ${color} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0 text-xs text-muted-foreground">{time}</div>
    </div>
  );
}

// 主页组件
const DashboardPage = () => {
  const t = useTranslations('DashboardIndex');
  const { getToken } = useAuth();
  const { organizationId } = useApiWithOrganization();
  const { toast } = useToast();
  const { projectId } = useProject();

  const [loading, setLoading] = useState(true);
  const [recentEmails, setRecentEmails] = useState<EmailHistory[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    activeProjects: 0,
    monthlyEmails: 0,
    supplierCount: 0,
    pendingQuotes: 0
  });
  const [activeTab, setActiveTab] = useState('all');

  // 获取认证令牌
  const getAuthToken = async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("无法获取认证令牌");
      }
      return token;
    } catch (error) {
      console.error('获取认证令牌失败:', error);
      throw error;
    }
  };

  // 获取最近邮件
  const fetchRecentEmails = async (limit: number = 3) => {
    try {
      const token = await getAuthToken();
      
      // 如果没有选择项目，则获取所有邮件历史或先获取一个项目
      if (!projectId) {
        // 获取一个项目ID来获取邮件历史
        const projectListResponse = await fetch(`${API_BASE_URL}/projects?page=1&page_size=1`, 
          createRequestOptions('GET', token, null, organizationId)
        );
        
        if (projectListResponse.ok) {
          const projectData = await projectListResponse.json();
          if (projectData.items && projectData.items.length > 0) {
            const firstProjectId = projectData.items[0].id;
            
            // 使用获取到的项目ID请求邮件历史
            const options = createRequestOptions('GET', token, null, organizationId);
            const response = await fetch(`${API_BASE_URL}/projects/${firstProjectId}/history?limit=${limit}`, options);
            
            if (response.ok) {
              const data = await response.json();
              setRecentEmails(data);
            }
          } else {
            // 没有项目，设置空数组
            setRecentEmails([]);
          }
        }
      } else {
        // 使用已选项目ID
        const options = createRequestOptions('GET', token, null, organizationId);
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/history?limit=${limit}`, options);
        
        if (response.ok) {
          const data = await response.json();
          setRecentEmails(data);
        }
      }
    } catch (error) {
      console.error('获取最近邮件失败:', error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : '获取最近邮件失败',
        variant: "destructive",
      });
    }
  };

  // 获取最近项目
  const fetchRecentProjects = async () => {
    try {
      const token = await getAuthToken();
      
      const options = createRequestOptions('GET', token, null, organizationId);
      const response = await fetch(`${API_BASE_URL}/projects?page=1&page_size=4`, options);
      
      if (!response.ok) {
        throw new Error('获取项目列表失败');
      }
      
      const data = await response.json();
      setRecentProjects(data.items || []);
    } catch (error) {
      console.error('获取项目列表失败:', error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : '获取项目列表失败',
        variant: "destructive",
      });
    }
  };

  // 获取仪表盘统计数据
  const fetchDashboardStats = async () => {
    try {
      const token = await getAuthToken();
      
      // 创建请求选项
      const options = createRequestOptions('GET', token, null, organizationId);
      
      // 获取活跃项目数量
      const projectsResponse = await fetch(`${API_BASE_URL}/projects?page=1&page_size=1&status=open`, options);
      let activeProjects = 0;
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        activeProjects = projectsData.total || 0;
      }
      
      // 获取本月邮件数量 - 使用现有项目的历史记录API
      let monthlyEmails = 0;
      if (activeProjects > 0) {
        // 先获取一个项目ID
        const projectListResponse = await fetch(`${API_BASE_URL}/projects?page=1&page_size=1`, options);
        if (projectListResponse.ok) {
          const projectData = await projectListResponse.json();
          if (projectData.items && projectData.items.length > 0) {
            const projectId = projectData.items[0].id;
            
            // 获取该项目的邮件历史，设置较大的limit以便准确统计
            const emailHistoryResponse = await fetch(`${API_BASE_URL}/projects/${projectId}/history?limit=100`, options);
            if (emailHistoryResponse.ok) {
              const emailHistory = await emailHistoryResponse.json();
              
              // 计算本月邮件数量
              const now = new Date();
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              monthlyEmails = emailHistory.filter((email: any) => {
                return email.sent_at && new Date(email.sent_at) >= startOfMonth;
              }).length;
            }
          }
        }
      }
      
      // 获取供应商数量
      const suppliersResponse = await fetch(`${API_BASE_URL}/suppliers`, options);
      let supplierCount = -1;
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        supplierCount = suppliersData.length || 0;
      }
      
      // 获取待定报价数量 - 这里需要根据实际API调整
      // 由于可能没有直接API，可以近似使用开放状态的会话数量
      const conversationsResponse = await fetch(`${API_BASE_URL}/conversations?page=1&page_size=1&status=open`, options);
      let pendingQuotes = 0;
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        pendingQuotes = conversationsData.total || 0;
      }
      
      // 更新统计数据
      setDashboardStats({
        activeProjects,
        monthlyEmails,
        supplierCount,
        pendingQuotes
      });
      
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 这里不显示错误通知，保持用户体验流畅
    }
  };

  // 处理回复邮件
  const handleReplyEmail = (email: EmailHistory) => {
    // 在实际情况下，这里会导航到RFQ页面并打开邮件对话框
    toast({
      title: "回复邮件",
      description: `正在回复邮件：${email.subject}`,
    });
    window.location.href = `/dashboard/rfq?action=reply&email=${email.id}`;
  };

  // 处理转发邮件
  const handleForwardEmail = (email: EmailHistory) => {
    // 在实际情况下，这里会导航到RFQ页面并打开邮件对话框
    toast({
      title: "转发邮件",
      description: `正在转发邮件：${email.subject}`,
    });
    window.location.href = `/dashboard/rfq?action=forward&email=${email.id}`;
  };

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchRecentEmails(3), // 显式传递参数，限制为5条邮件
          fetchRecentProjects(),
          fetchDashboardStats() // 添加获取统计数据
        ]);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 主内容区域 */}
        <div className="md:col-span-2 space-y-6">
          {/* 邮件历史卡片 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  最近邮件
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/rfq?tab=emails">
                    查看全部
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="sent">已发送</TabsTrigger>
                  <TabsTrigger value="fail">发送失败</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="w-full">
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-1/6" />
                          </div>
                          <Skeleton className="h-4 w-2/3 mt-2" />
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <Skeleton className="h-20 w-full" />
                        </CardContent>
                      </Card>
                    ))
                  ) : recentEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">无邮件记录</h3>
                      <p className="text-muted-foreground mt-1">
                        您尚未发送过任何邮件
                      </p>
                      <Button className="mt-4" asChild>
                        <Link href="/dashboard/rfq">
                          <Send className="mr-2 h-4 w-4" /> 发送询价邮件
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentEmails.map((email) => (
                        <EmailItem 
                          key={email.id} 
                          email={email} 
                          onReply={handleReplyEmail}
                          onForward={handleForwardEmail}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="sent" className="space-y-4">
                  {loading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="space-y-4">
                      {recentEmails
                        .filter(email => email.status === 'sent')
                        .map((email) => (
                          <EmailItem 
                            key={email.id} 
                            email={email} 
                            onReply={handleReplyEmail}
                            onForward={handleForwardEmail}
                          />
                        ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="fail" className="space-y-4">
                  {loading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="space-y-4">
                      {recentEmails
                        .filter(email => email.status !== 'sent')
                        .map((email) => (
                          <EmailItem 
                            key={email.id} 
                            email={email} 
                            onReply={handleReplyEmail}
                            onForward={handleForwardEmail}
                          />
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 活动摘要 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                最近活动
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  <ActivityItem 
                    icon={<Mail className="h-4 w-4" />}
                    title="发送了询价邮件"
                    description="向供应商 ABC 发送了零件询价"
                    time="今天 14:30"
                    color="bg-blue-100 text-blue-500"
                  />
                  <ActivityItem 
                    icon={<CheckCircle className="h-4 w-4" />}
                    title="完成项目创建"
                    description="创建了新项目 '2024年第二季度采购'"
                    time="昨天"
                    color="bg-green-100 text-green-500"
                  />
                  <ActivityItem 
                    icon={<AlertCircle className="h-4 w-4" />}
                    title="邮件发送失败"
                    description="向 supplier@example.com 的邮件发送失败"
                    time="2天前"
                    color="bg-red-100 text-red-500"
                  />
                  <ActivityItem 
                    icon={<Archive className="h-4 w-4" />}
                    title="归档了项目"
                    description="归档了 '2023年第四季度采购'"
                    time="1周前"
                    color="bg-yellow-100 text-yellow-600"
                  />
                  <ActivityItem 
                    icon={<Star className="h-4 w-4" />}
                    title="收到新的报价"
                    description="供应商 XYZ 提交了新的报价"
                    time="2周前"
                    color="bg-purple-100 text-purple-500"
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 简易统计卡片 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <LineChart className="mr-2 h-5 w-5" />
                数据统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">活跃项目</div>
                  <div className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-10" /> : dashboardStats.activeProjects}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">本月邮件</div>
                  <div className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-10" /> : dashboardStats.monthlyEmails}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">供应商</div>
                  <div className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-10" /> : dashboardStats.supplierCount}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">待定报价</div>
                  <div className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-10" /> : dashboardStats.pendingQuotes}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/rfq">
                    查看询价管理
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
