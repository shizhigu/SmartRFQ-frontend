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
  LineChart,
  ArrowUp,
  ArrowDown,
  Folder,
  Wrench,
  Users,
  Upload,
  FilePlus2,
  Brain,
  Search,
  Calendar
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  parts_count?: number;
  last_updated?: string;
}

// 仪表盘统计数据接口
interface DashboardStats {
  activeProjects: number;
  rfqItemsCount: number;
  supplierCount: number;
  pendingQuotes: number;
  rfqConversationsCount: number;
  recentActivities?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    created_at: string;
    entity_type?: string;
    entity_id?: string;
  }>;
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

// 统计卡片组件
function StatCard({
  icon,
  title,
  value,
  change,
  loading
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  change?: number;
  loading: boolean;
}) {
  const isPositiveChange = change !== undefined && change > 0;
  const isNegativeChange = change !== undefined && change < 0;
  
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full p-3 bg-primary/10 text-primary">
            {icon}
          </div>
          {change !== undefined && (
            <Badge variant={isPositiveChange ? "default" : isNegativeChange ? "destructive" : "secondary"} className="flex items-center gap-1">
              {isPositiveChange ? <ArrowUp className="h-3 w-3" /> : isNegativeChange ? <ArrowDown className="h-3 w-3" /> : null}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-3xl font-bold mt-1">
            {loading ? <Skeleton className="h-9 w-16" /> : value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 快速操作卡片组件
function QuickActionCard({
  icon,
  title,
  href,
  onClick,
  bgColor = "bg-primary/10",
  iconColor = "text-primary"
}: {
  icon: React.ReactNode;
  title: string;
  href?: string;
  onClick?: () => void;
  bgColor?: string;
  iconColor?: string;
}) {
  const content = (
    <div className={`rounded-full p-4 ${bgColor} ${iconColor} mb-3`}>
      {icon}
    </div>
  );

  if (onClick) {
    return (
      <Card className="h-full hover:border-primary/50 transition-all duration-300">
        <CardContent className="p-0">
          <button 
            onClick={onClick}
            className="flex flex-col items-center justify-center p-6 h-full w-full text-center"
          >
            {content}
            <h3 className="font-medium">{title}</h3>
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-0">
        <Link 
          href={href || '#'}
          className="flex flex-col items-center justify-center p-6 h-full text-center"
        >
          {content}
          <h3 className="font-medium">{title}</h3>
        </Link>
      </CardContent>
    </Card>
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
    rfqItemsCount: 0,
    supplierCount: 0,
    pendingQuotes: 0,
    rfqConversationsCount: 0,
    recentActivities: []
  });
  const [activeTab, setActiveTab] = useState('all');
  const [projectIdReady, setProjectIdReady] = useState(false);
  
  // 新增：创建项目的状态
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    status: 'draft'
  });

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
  // const handleForwardEmail = (email: EmailHistory) => {
  //   // 在实际情况下，这里会导航到RFQ页面并打开邮件对话框
  //   toast({
  //     title: "转发邮件",
  //     description: `正在转发邮件：${email.subject}`,
  //   });
  //   window.location.href = `/dashboard/rfq?action=forward&email=${email.id}`;
  // };

  // 监听projectId的变化
  useEffect(() => {
    if (!projectIdReady && projectId !== null) {
      setProjectIdReady(true);
    }
  }, [projectId, projectIdReady]);

  // 新增：专门监听项目ID变化的钩子，当项目变化时重新加载统计数据
  useEffect(() => {
    if (projectId && organizationId) {
      console.log('项目ID变化，重新加载仪表盘数据:', projectId);
      
      // 获取仪表盘统计数据
      const fetchDashboardStats = async () => {
        try {
          setLoading(true);
          const token = await getAuthToken();
          
          // 创建请求选项
          const options = createRequestOptions('GET', token, null, organizationId);
          
          console.log('重新加载仪表盘数据，organizationId:', organizationId, 'projectId:', projectId);
          
          const summaryResponse = await fetch(
            `${API_BASE_URL}/dashboard/summary/${organizationId}/${projectId}`, 
            options
          );
          
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            
            // 获取待定报价数量
            const conversationsResponse = await fetch(`${API_BASE_URL}/conversations?page=1&page_size=1&status=open`, options);
            let pendingQuotes = 0;
            if (conversationsResponse.ok) {
              const conversationsData = await conversationsResponse.json();
              pendingQuotes = conversationsData.total || 0;
            }
            
            // 更新统计数据
            setDashboardStats({
              activeProjects: summaryData.activeProjects || 0,
              rfqItemsCount: summaryData.rfqItemsCount || 0,
              supplierCount: summaryData.supplierCount || 0,
              pendingQuotes,
              rfqConversationsCount: summaryData.rfqConversationsCount || 0,
              recentActivities: summaryData.recentActivities || []
            });
          } else {
            console.error('项目变更后获取仪表盘摘要数据失败:', summaryResponse.status);
          }
        } catch (error) {
          console.error('项目变更后获取统计数据失败:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchDashboardStats();
      fetchRecentProjects();
    }
  }, [projectId, organizationId]); // 直接依赖projectId和organizationId

  // 获取最近项目列表
  const fetchRecentProjects = async () => {
    try {
      // 如果没有组织ID，则不能获取项目
      if (!organizationId) {
        return;
      }
      
      const token = await getAuthToken();
      const options = createRequestOptions('GET', token, null, organizationId);
      
      // 获取最近的项目，限制为5个
      const response = await fetch(
        `${API_BASE_URL}/projects?page=1&page_size=5&sort=-created_at`, 
        options
      );
      
      if (!response.ok) {
        throw new Error('获取最近项目失败');
      }
      
      const data = await response.json();
      console.log('最近项目数据:', data);
      
      if (data && data.items) {
        const projects = data.items;
        
        // 获取每个项目的零件数量
        await Promise.all(projects.map(async (project: Project) => {
          try {
            // 请求该项目的RFQ零件数量
            const rfqItemsResponse = await fetch(
              `${API_BASE_URL}/projects/${project.id}/rfq-items?page=1&page_size=1`, 
              options
            );
            
            if (rfqItemsResponse.ok) {
              const rfqItemsData = await rfqItemsResponse.json();
              // 更新项目的零件数量字段
              project.parts_count = rfqItemsData.length || 0;
            } else {
              console.error(`获取项目 ${project.id} 零件数量失败:`, rfqItemsResponse.status);
            }
          } catch (error) {
            console.error(`获取项目 ${project.id} 零件数量失败:`, error);
            project.parts_count = 0; // 设置默认值为0
          }
        }));
        
        // 更新状态
        setRecentProjects(projects);
      }
    } catch (error) {
      console.error('获取最近项目失败:', error);
    }
  };

  // 加载数据 - 重新添加此钩子用于页面初始加载
  useEffect(() => {
    // 获取仪表盘统计数据
    const fetchDashboardStats = async () => {
      try {
        const token = await getAuthToken();
        
        // 创建请求选项
        const options = createRequestOptions('GET', token, null, organizationId);

        // 使用新的API端点获取仪表盘摘要数据
        const targetProjectId = projectId || 'all';
        if (!organizationId) {
          return;
        }
        
        console.log('初始加载仪表盘数据，organizationId:', organizationId, 'projectId:', targetProjectId);
        
        const summaryResponse = await fetch(
          `${API_BASE_URL}/dashboard/summary/${organizationId}/${targetProjectId}`, 
          options
        );
        
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          
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
            activeProjects: summaryData.activeProjects || 0,
            rfqItemsCount: summaryData.rfqItemsCount || 0,
            supplierCount: summaryData.supplierCount || 0,
            pendingQuotes,
            rfqConversationsCount: summaryData.rfqConversationsCount || 0,
            recentActivities: summaryData.recentActivities || []
          });
        } else {
          console.error('获取仪表盘摘要数据失败:', summaryResponse.status);
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 这里不显示错误通知，保持用户体验流畅
      }
    };

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchRecentProjects(),
          fetchDashboardStats()
        ]);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    // 只有当organizationId存在时才加载数据
    if (organizationId) {
      loadData();
    }
  }, [organizationId, projectId, projectIdReady]); // 添加projectId作为依赖

  // 新增：创建新项目的函数
  const handleCreateProject = async () => {
    try {
      const token = await getAuthToken();
      
      if (!newProjectForm.name.trim()) {
        toast({
          title: "错误",
          description: "项目名称不能为空",
          variant: "destructive",
        });
        return;
      }
      
      const options = createRequestOptions('POST', token, {
        name: newProjectForm.name,
        description: newProjectForm.description,
        status: newProjectForm.status
      }, organizationId);
      
      const response = await fetch(`${API_BASE_URL}/projects`, options);
      
      if (!response.ok) {
        throw new Error('创建项目失败');
      }
      
      const newProject = await response.json();
      
      // 更新项目列表
      fetchRecentProjects();
      
      // 重置表单并关闭对话框
      setNewProjectForm({
        name: '',
        description: '',
        status: 'draft'
      });
      setCreateProjectDialogOpen(false);
      
      toast({
        title: "成功",
        description: "项目创建成功",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : '创建项目失败',
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* 1. 指标总览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Folder className="h-6 w-6" />}
            title="Projects"
            value={dashboardStats.activeProjects}
            change={12}
            loading={loading}
          />
          <StatCard 
            icon={<Wrench className="h-6 w-6" />}
            title="RFQ Items"
            value={dashboardStats.rfqItemsCount}
            change={5}
            loading={loading}
          />
          <StatCard 
            icon={<Users className="h-6 w-6" />}
            title="Suppliers"
            value={dashboardStats.supplierCount}
            change={-3}
            loading={loading}
          />
          <StatCard 
            icon={<Mail className="h-6 w-6" />}
            title="RFQ Conversations"
            value={dashboardStats.rfqConversationsCount}
            loading={loading}
          />
        </div>

        {/* 2. 快速入口 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard 
            icon={<FilePlus2 className="h-5 w-5" />}
            title="Create Project"
            onClick={() => setCreateProjectDialogOpen(true)}
            bgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <QuickActionCard 
            icon={<Upload className="h-5 w-5" />}
            title="上传RFQ"
            href="/dashboard/rfq?tab=files"
            bgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <QuickActionCard 
            icon={<Brain className="h-5 w-5" />}
            title="解析RFQ"
            href="/dashboard/rfq?tab=files"
            bgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
          <QuickActionCard 
            icon={<Send className="h-5 w-5" />}
            title="发送RFQ"
            href="/dashboard/rfq?tab=emails"
            bgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3. 最近项目列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center">
                    <Folder className="mr-2 h-5 w-5" />
                    Recent Projects
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/projects">
                      View All
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="w-full">
                    <Skeleton className="h-12 w-full mb-3" />
                    <Skeleton className="h-12 w-full mb-3" />
                    <Skeleton className="h-12 w-full mb-3" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No projects yet</h3>
                    <p className="text-muted-foreground mt-1">
                      You haven't created any projects yet
                    </p>
                    <Button className="mt-4" onClick={() => setCreateProjectDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Create Project
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Items Count</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentProjects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  project.status === 'open' ? 'default' :
                                  project.status === 'closed' ? 'destructive' :
                                  project.status === 'archived' ? 'secondary' : 'outline'
                                }
                                className="text-xs"
                              >
                                {project.status === 'open' ? 'In Progress' :
                                project.status === 'draft' ? 'Draft' :
                                 project.status === 'closed' ? 'Closed' :
                                 project.status === 'archived' ? 'Archived' : project.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{project.parts_count}</TableCell>
                            <TableCell>
                              {project.last_updated 
                                ? format(new Date(project.last_updated), 'yyyy-MM-dd')
                                : format(new Date(project.created_at), 'yyyy-MM-dd')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/projects/${project.id}`}>
                                  <Search className="h-3.5 w-3.5 mr-1" />
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 4. 最近动态 */}
          <div>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Recent Activities
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
                ) : dashboardStats.recentActivities && dashboardStats.recentActivities.length > 0 ? (
                  <div className="divide-y">
                    {dashboardStats.recentActivities.map((activity) => {
                      // 根据活动类型确定要显示的图标和颜色
                      let icon = <Clock className="h-4 w-4" />;
                      let color = "bg-muted text-muted-foreground";
                      
                      if (activity.type === 'upload') {
                        icon = <Upload className="h-4 w-4" />;
                        color = "bg-blue-100 text-blue-500";
                      } else if (activity.type === 'email' || activity.type === 'conversation') {
                        icon = <Mail className="h-4 w-4" />;
                        color = "bg-green-100 text-green-500";
                      } else if (activity.type === 'parse') {
                        icon = <Wrench className="h-4 w-4" />;
                        color = "bg-purple-100 text-purple-500";
                      } else if (activity.type === 'project_create') {
                        icon = <CheckCircle className="h-4 w-4" />;
                        color = "bg-green-100 text-green-500";
                      } else if (activity.type === 'email_failure' || activity.type === 'error') {
                        icon = <AlertCircle className="h-4 w-4" />;
                        color = "bg-red-100 text-red-500";
                      } else if (activity.type === 'archive') {
                        icon = <Archive className="h-4 w-4" />;
                        color = "bg-yellow-100 text-yellow-600";
                      } else if (activity.type === 'quote' || activity.type === 'quote_received') {
                        icon = <Star className="h-4 w-4" />;
                        color = "bg-purple-100 text-purple-500";
                      }
                      
                      // 计算多久以前的活动
                      const activityTime = new Date(activity.created_at);
                      const now = new Date();
                      const diffInMs = now.getTime() - activityTime.getTime();
                      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                      
                      let timeText;
                      if (diffInDays > 7) {
                        timeText = `${Math.floor(diffInDays / 7)}周前`;
                      } else if (diffInDays > 0) {
                        timeText = `${diffInDays}天前`;
                      } else if (diffInHours > 0) {
                        timeText = `${diffInHours}小时前`;
                      } else if (diffInMinutes > 0) {
                        timeText = `${diffInMinutes}分钟前`;
                      } else {
                        timeText = "刚刚";
                      }
                      
                      return (
                        <ActivityItem 
                          key={activity.id}
                          icon={icon}
                          title={activity.title}
                          description={activity.description}
                          time={timeText}
                          color={color}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">暂无活动记录</h3>
                    <p className="text-muted-foreground mt-1">
                      系统还未记录到任何活动
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/dashboard/rfq">
                        <Mail className="mr-2 h-4 w-4" /> 创建RFQ询价
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 创建项目对话框 */}
      <Dialog open={createProjectDialogOpen} onOpenChange={setCreateProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>创建新项目</DialogTitle>
            <DialogDescription>
              填写以下信息创建一个新项目
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                placeholder="请输入项目名称"
                value={newProjectForm.name}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                placeholder="请输入项目描述"
                value={newProjectForm.description}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">项目状态</Label>
              <Select 
                value={newProjectForm.status}
                onValueChange={(value) => setNewProjectForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="open">进行中</SelectItem>
                  <SelectItem value="closed">已关闭</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateProjectDialogOpen(false);
              setNewProjectForm({
                name: '',
                description: '',
                status: 'draft'
              });
            }}>
              取消
            </Button>
            <Button onClick={handleCreateProject}>创建项目</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage;
