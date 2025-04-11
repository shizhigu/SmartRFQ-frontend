'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, FileText, Upload, Mail, FileUp, Search, AlertCircle, RefreshCw, Download,
  ChevronRight, MoreHorizontal, FilePlus, FileQuestion, ListFilter, SortAsc, UploadCloud,
  Trash2, Edit, Check, X, Users, Archive, ChevronDown, ChevronUp, Reply, Forward,
  Filter,
  PlusCircle,
  Trash,
  CheckSquare,
  Square,
  ChevronLeft,
  // ChevronRight,
  Clock,
  Inbox,
  Send,
  Star,
  LineChart,
  ArrowUp,
  ArrowDown,
  Folder,
  Wrench,
  CheckCircle,
  Plus,
  Calendar,
  FilePlus2,
  Brain,
  // FileQuestion,
  // UploadCloud,
  // Download,
  // X,
  // Trash2,
  // RefreshCw,
  // Edit,
  // FilePlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useApiWithOrganization, API_BASE_URL, createRequestOptions } from '@/utils/api';
import { Badge } from "@/components/ui/badge";
import { ProjectCombobox, Project as ProjectType } from "@/components/ProjectCombobox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/Helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useProject } from '@/contexts/ProjectContext';
import { useTranslations } from 'next-intl';
import { Pencil } from "lucide-react";

// 数据类型定义
interface Project extends ProjectType {}

interface RfqFile {
  id: string;
  project_id: string;
  filename: string;
  file_url: string | null;
  ocr_text: string | null;
  uploaded_at: string;
}

interface RfqItem {
  id: string;
  project_id: string;
  index_no: number | null;
  part_number: string | null;
  name: string | null;
  quantity: string | null;
  material: string | null;
  size: string | null;
  process: string | null;
  delivery_time: string | null;
  created_at: string;
  unit: string | null;
  tolerance: string | null;
  drawing_url: string | null;
  surface_finish: string | null;
  remarks: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

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

interface RfqConversation {
  id: string;
  project_id: string;
  supplier_id: string;
  status: string;
  last_activity: string;
  created_at: string;
  project_name: string | null;
  supplier_name: string | null;
  supplier_email: string | null;
}

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  tags: string[] | null;
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

// 编辑零件对话框组件
function PartEditDialog({ 
  open, 
  onOpenChange, 
  item, 
  onSave, 
  isSaving
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  item: RfqItem | null;
  onSave: (updatedItem: RfqItem) => Promise<void>;
  isSaving: boolean;
}) {
  const [localItem, setLocalItem] = useState<RfqItem | null>(null);
  // 使用不同名称的状态，避免与props重名
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 添加确认弹窗状态
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  // 保存原始项目数据，用于比较变更
  const [originalItem, setOriginalItem] = useState<RfqItem | null>(null);
  // 存储修改的字段及其变更内容
  const [changedFields, setChangedFields] = useState<{field: string, oldValue: any, newValue: any}[]>([]);
  // 添加toast通知
  const { toast } = useToast();

  // 当item改变时更新本地状态和原始数据
  useEffect(() => {
    if (item) {
      setLocalItem({...item});
      setOriginalItem({...item});
    }
  }, [item]);

  // 查找变更的字段
  const findChanges = () => {
    if (!originalItem || !localItem) return [];
    
    const changes: {field: string, oldValue: any, newValue: any}[] = [];
    const fieldLabels: Record<keyof RfqItem, string> = {
      id: 'ID',
      project_id: '项目ID',
      index_no: '序号',
      part_number: '零件编号',
      name: '零件名称',
      quantity: '数量',
      material: '材料',
      size: '尺寸',
      process: '工艺',
      delivery_time: '交期',
      created_at: '创建时间',
      unit: '单位',
      tolerance: '公差',
      drawing_url: '图号',
      surface_finish: '表面处理',
      remarks: '备注'
    };
    
    // 检查每个字段是否有变化
    for (const key in originalItem) {
      if (key === 'id' || key === 'project_id' || key === 'created_at') continue;
      
      const typedKey = key as keyof RfqItem;
      // 如果值不同，添加到变更列表
      if (originalItem[typedKey] !== localItem[typedKey]) {
        changes.push({
          field: fieldLabels[typedKey] || key,
          oldValue: originalItem[typedKey] === null ? '无' : originalItem[typedKey],
          newValue: localItem[typedKey] === null ? '无' : localItem[typedKey]
        });
      }
    }
    
    return changes;
  };

  // 处理表单字段变化
  const handleChange = (field: keyof RfqItem, value: string | number | null) => {
    if (localItem) {
      setLocalItem({
        ...localItem,
        [field]: value
      });
    }
  };

  // 处理保存操作 - 显示确认弹窗
  const handleSave = async () => {
    if (!localItem) return;
    
    // 找出修改的字段
    const changes = findChanges();
    
    // 如果没有变更，直接关闭
    if (changes.length === 0) {
      toast({
        description: "没有检测到任何修改",
      });
      return;
    }
    
    // 保存变更记录并打开确认弹窗
    setChangedFields(changes);
    setConfirmDialogOpen(true);
  };
  
  // 确认修改并提交
  const confirmChanges = async () => {
    if (!localItem) return;
    
    try {
      setIsSubmitting(true);
      await onSave(localItem);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('保存时出错:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理关闭操作
  const handleClose = () => {
    onOpenChange(false);
  };

  // 如果没有项目数据，返回null
  if (!localItem) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(open) => {
          if (!open) {
            // 关闭时重置状态
            setIsSubmitting(false);
            setConfirmDialogOpen(false);
          }
          onOpenChange(open);
        }}
      >
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>编辑零件信息</DialogTitle>
            <DialogDescription>
              修改下方表单以更新零件详情
            </DialogDescription>
          </DialogHeader>
          
          {/* 使用滚动区域包装表单内容 */}
          <div className="overflow-y-auto py-2 px-1 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_index_no">序号</Label>
                <Input
                  id="edit_index_no"
                  value={localItem.index_no?.toString() || ''}
                  onChange={(e) => handleChange('index_no', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_part_number">零件编号</Label>
                <Input
                  id="edit_part_number"
                  value={localItem.part_number || ''}
                  onChange={(e) => handleChange('part_number', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_name">零件名称</Label>
                <Input
                  id="edit_name"
                  value={localItem.name || ''}
                  onChange={(e) => handleChange('name', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_quantity">数量</Label>
                <Input
                  id="edit_quantity"
                  value={localItem.quantity || ''}
                  onChange={(e) => handleChange('quantity', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_material">材料</Label>
                <Input
                  id="edit_material"
                  value={localItem.material || ''}
                  onChange={(e) => handleChange('material', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_size">尺寸</Label>
                <Input
                  id="edit_size"
                  value={localItem.size || ''}
                  onChange={(e) => handleChange('size', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_process">工艺</Label>
                <Input
                  id="edit_process"
                  value={localItem.process || ''}
                  onChange={(e) => handleChange('process', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_delivery_time">交期</Label>
                <Input
                  id="edit_delivery_time"
                  value={localItem.delivery_time || ''}
                  onChange={(e) => handleChange('delivery_time', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_unit">单位</Label>
                <Input
                  id="edit_unit"
                  value={localItem.unit || ''}
                  onChange={(e) => handleChange('unit', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_tolerance">公差</Label>
                <Input
                  id="edit_tolerance"
                  value={localItem.tolerance || ''}
                  onChange={(e) => handleChange('tolerance', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_drawing_url">图号</Label>
                <Input
                  id="edit_drawing_url"
                  value={localItem.drawing_url || ''}
                  onChange={(e) => handleChange('drawing_url', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_surface_finish">表面处理</Label>
                <Input
                  id="edit_surface_finish"
                  value={localItem.surface_finish || ''}
                  onChange={(e) => handleChange('surface_finish', e.target.value || null)}
                />
              </div>
              
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="edit_remarks">备注</Label>
                <Textarea
                  id="edit_remarks"
                  value={localItem.remarks || ''}
                  onChange={(e) => handleChange('remarks', e.target.value || null)}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="shrink-0 mt-4 pt-2 border-t">
            <Button 
              variant="outline" 
              onClick={handleClose}
              type="button"
            >
              取消
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || isSubmitting}
              type="button"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 确认变更弹窗 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认修改</AlertDialogTitle>
            <AlertDialogDescription>
              请确认以下字段的修改：
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="max-h-[50vh] overflow-y-auto my-4 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>字段</TableHead>
                  <TableHead>原值</TableHead>
                  <TableHead>新值</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changedFields.map((change, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{change.field}</TableCell>
                    <TableCell className="text-muted-foreground">{change.oldValue}</TableCell>
                    <TableCell className="font-semibold">{change.newValue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmChanges}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认修改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function RfqPage() {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { organizationId } = useApiWithOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 修改这一行，使用已有的国际化键或者移除它
  // const t = useTranslations('RfqPage');
  
  // 状态管理
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  // 使用全局Context而不是本地状态
  const { projectId, setProjectId } = useProject();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [rfqFiles, setRfqFiles] = useState<RfqFile[]>([]);
  const [rfqItems, setRfqItems] = useState<RfqItem[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState(() => {
    // 从URL参数获取初始标签页
    const tab = searchParams.get('tab');
    if (tab && ['projects', 'files', 'items', 'emails'].includes(tab)) {
      return tab;
    }
    return "projects";
  });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    pages: 0
  });
  // 添加编辑模式和多选状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 邮件状态
  const [emailHistories, setEmailHistories] = useState<EmailHistory[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [conversations, setConversations] = useState<RfqConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<RfqConversation | null>(null);
  const [conversationDialogOpen, setConversationDialogOpen] = useState(false);
  const [conversationEmails, setConversationEmails] = useState<EmailHistory[]>([]);
  const [conversationItems, setConversationItems] = useState<RfqItem[]>([]);
  const [loadingConversationDetails, setLoadingConversationDetails] = useState(false);
  
  // 邮件表单状态
  const [emailForm, setEmailForm] = useState({
    to_email: '',
    subject: '',
    content: '',
    cc_email: '',
    bcc_email: '',
    conversation_id: null as string | null,
    rfq_item_ids: [] as string[]
  });
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);

  // 添加供应商选择对话框状态
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [templateGenerating, setTemplateGenerating] = useState(false);

  // 添加新的状态
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [projectFilterStatus, setProjectFilterStatus] = useState<string | null>(null);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    status: 'draft'
  });
  const [projectsSelected, setProjectsSelected] = useState<string[]>([]);
  const [allProjectsSelected, setAllProjectsSelected] = useState(false);
  const [showProjectDeleteDialog, setShowProjectDeleteDialog] = useState(false);
  
  // 添加编辑状态
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<RfqItem>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 添加编辑弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<RfqItem | null>(null);
  
  // 初始加载数据
  useEffect(() => {
    fetchProjects();
    fetchSuppliers();
  }, [pagination.page, organizationId]);

  // 认证令牌获取
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

  // 获取项目列表
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      
      const endpoint = `/projects?page=${pagination.page}&page_size=${pagination.page_size}`;
      const options = createRequestOptions('GET', token, null, organizationId);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error('获取项目列表失败');
      }
      
      const data: PaginatedResponse<Project> = await response.json();
      setProjects(data.items);
      setPagination({
        page: data.page,
        page_size: data.page_size,
        total: data.total,
        pages: data.pages
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get project list',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 选择项目并获取RFQ文件和零件
  const selectProject = async (project: Project) => {
    // 如果项目已归档，显示提示并不允许选择
    if (project.status === 'archived') {
      toast({
        title: "Project archived",
        description: "You cannot select archived projects",
        variant: "destructive",
      });
      return;
    }
    
    // 如果选择的是当前显示的项目，不需要重新加载数据
    if (projectId === project.id) {
      return;
    }
    
    // 更新本地状态
    setSelectedProject(project);
    // 更新全局Context中的projectId
    setProjectId(project.id);
    
    // 只有当前不是在文件页时，才自动切换到文件页
    if (currentTab === "projects") {
      setCurrentTab("files");
    }
    
    try {
      setIsLoading(true);
      await fetchRfqFiles(project.id);
    } catch (error) {
      console.error("Error fetching RFQ data:", error);
      toast({
        title: "Error",
        description: "Failed to load project data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 获取项目的RFQ文件
  const fetchRfqFiles = async (projectId: string) => {
    try {
      const token = await getAuthToken();
      
      const options = createRequestOptions('GET', token, null, organizationId);
      
      // 获取RFQ零件列表
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/rfq-items`, options);
      
      if (!response.ok) {
        throw new Error('获取RFQ零件列表失败');
      }
      
      const data = await response.json();
      setRfqItems(data);
      
      // 获取RFQ文件列表
      const filesResponse = await fetch(`${API_BASE_URL}/projects/${projectId}/rfq-files`, options);
      if (!filesResponse.ok) {
        throw new Error('获取RFQ文件列表失败');
      }
      
      const filesData = await filesResponse.json();
      setRfqFiles(filesData);
      
      // 获取成功后更新状态
      setCurrentTab("files");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get RFQ data',
        variant: "destructive",
      });
      throw error; // 重新抛出错误以便调用方处理
    }
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        setSelectedFile(file);
      }
    }
  };

  // 文件上传处理
  const handleFileUpload = async () => {
    if (!projectId || !selectedProject || !selectedFile) {
      toast({
        title: "Error",
        description: "Please select a project and file first",
        variant: "destructive",
      });
      return;
    }

    setFileUploading(true);
    try {
      const token = await getAuthToken();
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', selectedFile);

      // 创建适用于文件上传的请求选项
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      };
      
      // 如果有组织ID，添加到头信息中
      if (organizationId) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'X-Organization-Id': organizationId
        };
      }
      
      // 发送请求
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/upload-rfq`, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '文件上传失败');
      }
      
      const data = await response.json();
      
      toast({
        title: "Upload successful",
        description: "RFQ file has been uploaded successfully",
        variant: "default",
      });
      
      // 关闭对话框并重新获取文件列表
      setUploadDialogOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // 更新文件列表
      // 这里假设上传成功后返回的是文件对象
      setRfqFiles(prev => [...prev, data]);
      
      // 询问是否立即解析文件
      if (confirm("File uploaded successfully. Parse it now?")) {
        parseRfqFile(data.id);
      }
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'An error occurred during file upload',
        variant: "destructive",
      });
    } finally {
      setFileUploading(false);
    }
  };

  // 解析RFQ文件
  const parseRfqFile = async (fileId: string) => {
    if (!projectId || !selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    setParsing(true);
    try {
      const token = await getAuthToken();
      
      // 修改：将文件ID添加到请求体中
      const options = createRequestOptions('POST', token, { file_id: fileId }, organizationId);
      
      // 发送解析请求
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/parse-rfq`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'RFQ解析失败');
      }
      
      const data = await response.json();
      
      toast({
        title: "解析成功",
        description: `成功解析 ${data.items.length} 个零件`,
        variant: "default",
      });
      
      // 更新零件列表并切换到零件标签
      setRfqItems(data.items);
      setCurrentTab("items");
      
    } catch (error) {
      toast({
        title: "解析失败",
        description: error instanceof Error ? error.message : 'RFQ解析过程中发生错误',
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  // 生成并发送询价邮件
  const generateAndSendEmail = async () => {
    if (!projectId || !selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    try {
      // 如果供应商列表为空，先尝试加载
      if (suppliers.length === 0) {
        await fetchSuppliers();
      }
      
      // 再次检查供应商列表
      if (suppliers.length === 0) {
        toast({
          title: "Error",
          description: "No suppliers available. Please add suppliers first.",
          variant: "destructive",
        });
        return;
      }

      // 打开供应商选择对话框
      setSupplierDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : '发生错误',
        variant: "destructive",
      });
    }
  };

  // 为选中的零件生成询价邮件模板
  const generateEmailTemplateForSelected = async () => {
    if (!projectId || !selectedProject || selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select a project and parts first",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("当前供应商列表状态:", suppliers);
      
      // 强制重新加载供应商列表
      await fetchSuppliers();
      
      // 再次检查供应商列表
      console.log("重新加载后的供应商列表:", suppliers);
      
      if (suppliers.length === 0) {
        // 显示更详细的错误信息，便于调试
        toast({
          title: "供应商列表为空",
          description: "System failed to load any suppliers. Please confirm that you have added suppliers and check the browser console for more error information.",
          variant: "destructive",
        });
        return;
      }

      // 打开供应商选择对话框
      setSupplierDialogOpen(true);
      
    } catch (error) {
      console.error("生成询价邮件时出错:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : '发生错误',
        variant: "destructive",
      });
    }
  };

  // 生成邮件模板
  const generateTemplate = async (supplierId: string) => {
    if (!projectId || !selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }
    
    setTemplateGenerating(true);
    try {
      // 记录请求开始
      console.log(`准备生成邮件模板: 项目ID=${projectId}, 供应商ID=${supplierId}`);
      
      // 获取认证令牌
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error("无法获取认证令牌，请重新登录");
      }
      
      console.log("认证令牌获取成功，长度:", token ? token.length : 0);
      
      // 构建API请求路径 - 修正路径以匹配后端路由
      const endpoint = `/projects/${projectId}/conversations/${supplierId}/generate-template`;
      console.log("请求端点:", `${API_BASE_URL}${endpoint}`);
      
      // 修改：始终发送数组，如果没有选中项则发送空数组，避免发送 null
      const body = { item_ids: selectedItems.length > 0 ? selectedItems : [] };
      
      console.log("发送请求体:", JSON.stringify(body)); // 调试日志
      
      // 创建请求选项
      const options = createRequestOptions('POST', token, body, organizationId);
      console.log("完整请求选项 (去除敏感信息):", {
        method: options.method,
        headers: {
          ...options.headers as Record<string, string>,
          'Authorization': '***截断***',
        },
        body: options.body,
        credentials: options.credentials
      });
      
      // 如果有组织ID，记录它
      if (organizationId) {
        console.log("使用组织ID:", organizationId);
      }
      
      // 发送请求
      console.log("开始发送请求...");
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      console.log("收到响应，状态:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("请求失败，错误文本:", errorText);
        
        let errorDetail = `请求失败 (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail || errorDetail;
        } catch (e) {
          // 如果不是JSON，使用原始文本
          if (errorText) errorDetail = errorText;
        }
        
        throw new Error(errorDetail);
      }
      
      const data = await response.json();
      console.log("生成模板成功:", data);
      
      // 如果selectedSupplier为空，尝试从suppliers列表中获取
      let supplierEmail = selectedSupplier?.email || '';
      if (!supplierEmail) {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
          supplierEmail = supplier.email;
          // 同时更新selectedSupplier状态
          setSelectedSupplier(supplier);
        }
      }
      
      // 生成邮件表单
      setEmailForm({
        to_email: supplierEmail,
        subject: data.subject || '',
        content: data.content || '',
        cc_email: '',
        bcc_email: '',
        conversation_id: data.conversation_id,
        rfq_item_ids: selectedItems
      });
      
      // 打开邮件对话框
      setEmailDialogOpen(true);
      
      // 清除选中项目
      setSelectedItems([]);
      
    } catch (error) {
      console.error("生成模板失败:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate template",
        variant: "destructive",
      });
    } finally {
      setTemplateGenerating(false);
    }
  };

  // 下载RFQ文件
  const downloadRfqFile = async (fileId: string) => {
    if (!projectId || !selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await getAuthToken();
      
      // 创建下载请求
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/rfq-files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(organizationId ? { 'X-Organization-Id': organizationId } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error('File download failed');
      }
      
      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'downloaded_file';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // 创建Blob并下载
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download successful",
        description: "File has been downloaded successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : 'An error occurred during file download',
        variant: "destructive",
      });
    }
  };

  // 选择/取消选择所有项目
  const toggleAllItems = (checked: boolean) => {
    if (checked) {
      setSelectedItems(rfqItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 选择/取消选择单个项目
  const toggleItemSelection = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // 删除选中的部件
  const deleteSelectedItems = async () => {
    if (!selectedProject || selectedItems.length === 0) return;

    try {
      const token = await getAuthToken();
      
      // 调用后端批量删除API
      const options = createRequestOptions('POST', token, { item_ids: selectedItems }, organizationId);
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProject.id}/rfq-items/batch-delete`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Delete parts failed');
      }
      
      const result = await response.json();
      
      // 从本地状态中移除已删除的项目
      setRfqItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      
      // 重置选择状态
      setSelectedItems([]);
      setIsEditMode(false);
      setDeleteConfirmText('');
      setIsDeleteDialogOpen(false);
      
      // 显示成功消息
      sonnerToast.success(`Successfully deleted ${result.deleted_count} parts`);
    } catch (error) {
      sonnerToast.error(`Delete parts failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 渲染项目列表
  const renderProjects = () => {
    if (isLoading && projects.length === 0) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <FilePlus className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="text-sm text-muted-foreground">
              Create a project first before adding RFQ files
            </p>
            <Button onClick={() => setCreateProjectDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Project
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* 顶部导航区域 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Projects</h2>
          <Button onClick={() => setCreateProjectDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
        
        {/* 搜索和筛选区域 */}
        <div className="flex items-center gap-4 mb-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={projectSearchTerm}
              onChange={handleProjectSearch}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" /> 
                {projectFilterStatus ? `Status: ${projectFilterStatus}` : 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setProjectFilterStatus(null)}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProjectFilterStatus('open')}>
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProjectFilterStatus('closed')}>
                <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                Closed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProjectFilterStatus('draft')}>
                <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProjectFilterStatus('archived')}>
                <div className="h-2 w-2 rounded-full bg-gray-500 mr-2"></div>
                Archived
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 项目表格 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <div className="flex items-center" onClick={() => toggleSelectAllProjects(!allProjectsSelected)}>
                    {allProjectsSelected ? (
                      <CheckSquare className="h-5 w-5 text-primary cursor-pointer" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground cursor-pointer" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex items-center" onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectSelection(project.id, !projectsSelected.includes(project.id));
                      }}>
                        {projectsSelected.includes(project.id) ? (
                          <CheckSquare className="h-5 w-5 text-primary cursor-pointer" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground cursor-pointer" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.description || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          project.status === 'open' ? 'default' :
                          project.status === 'closed' ? 'destructive' :
                          project.status === 'archived' ? 'secondary' : 'outline'
                        }
                      >
                        {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(project.created_at), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => selectProject(project)}
                        disabled={project.status === 'archived'}
                      >
                        Select <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No projects found matching your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页及批量操作区域 */}
        <div className="flex items-center justify-between mt-4">
          {pagination.pages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages || isLoading}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {projectsSelected.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowProjectDeleteDialog(true)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete Selected ({projectsSelected.length})
              </Button>
            </div>
          )}
        </div>
      </>
    );
  };

  // 渲染RFQ文件列表
  const renderRfqFiles = () => {
    if (!selectedProject) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Project required</AlertTitle>
          <AlertDescription>
            You need to select a project before managing RFQ files.
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setCurrentTab("projects")}
            >
              Go to Projects
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* 注释掉重复的项目选择器
            <ProjectCombobox 
              projects={projects}
              selectedProject={selectedProject}
              onSelect={selectProject}
              className="min-w-[250px]"
            />
            */}
            <div className="flex items-center">
              <h2 className="text-xl font-semibold">
                RFQ Files
              </h2>
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                selectedProject?.status === 'open' ? 'bg-green-100 text-green-800' :
                selectedProject?.status === 'closed' ? 'bg-red-100 text-red-800' :
                selectedProject?.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedProject?.status ? selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1) : 'Draft'}
              </span>
            </div>
          </div>
          <Button 
            onClick={() => setUploadDialogOpen(true)}
            disabled={selectedProject?.status ? ['closed', 'archived'].includes(selectedProject.status) : false}
          >
            <Upload className="mr-2 h-4 w-4" /> Upload RFQ File
          </Button>
        </div>

        {rfqFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 border rounded-md">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No RFQ Files</h3>
              <p className="text-sm text-muted-foreground">
                Upload RFQ files to start the inquiry process
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload File
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        {file.filename}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(file.uploaded_at), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>{file.ocr_text ? 'Parsed' : 'Not Parsed'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => parseRfqFile(file.id)}
                          disabled={parsing}
                        >
                          {parsing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
                          Parse
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {/* 查看文件内容 */}}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => downloadRfqFile(file.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </>
    );
  };

  // 渲染零件列表
  const renderRfqItems = () => {
    if (!selectedProject) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Project required</AlertTitle>
          <AlertDescription>
            You need to select a project before viewing RFQ items.
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setCurrentTab("projects")}
            >
              Go to Projects
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    // 项目信息和操作按钮
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* 注释掉重复的项目选择器
            <ProjectCombobox 
              projects={projects}
              selectedProject={selectedProject}
              onSelect={selectProject}
              className="min-w-[250px]"
            />
            */}
            <div className="flex items-center">
              <h2 className="text-xl font-semibold">
                Parts List
              </h2>
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                selectedProject.status === 'open' ? 'bg-green-100 text-green-800' :
                selectedProject.status === 'closed' ? 'bg-red-100 text-red-800' :
                selectedProject.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedProject.status ? selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1) : 'Draft'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditMode ? (
              <>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={selectedItems.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </Button>
                <Button variant="secondary" onClick={() => {
                  setIsEditMode(false);
                  setSelectedItems([]);
                }}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                {rfqItems.length > 0 && (
                  <Button onClick={generateEmailTemplateForSelected} disabled={selectedProject.status === 'archived' || selectedItems.length === 0}>
                    <Mail className="mr-2 h-4 w-4" /> Generate Inquiry
                  </Button>
                )}
                

              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                {rfqItems.length > 0 && (
                  <Button onClick={generateEmailTemplateForSelected} disabled={selectedProject.status === 'archived'}>
                    <Mail className="mr-2 h-4 w-4" /> Generate Inquiry
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {rfqItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 border rounded-md">
            <ListFilter className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No parts found</h3>
              <p className="text-sm text-muted-foreground">
                Upload and parse RFQ files to view parts
              </p>
              <Button onClick={() => setCurrentTab("files")}>
                View RFQ Files
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isEditMode && (
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={rfqItems.length > 0 && selectedItems.length === rfqItems.length}
                          onCheckedChange={toggleAllItems}
                        />
                      </TableHead>
                    )}
                    <TableHead>序号</TableHead>
                    <TableHead>零件编号</TableHead>
                    <TableHead>零件名称</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>材料</TableHead>
                    <TableHead>工艺</TableHead>
                    <TableHead>交期</TableHead>
                    <TableHead>单位</TableHead>
                    <TableHead>公差</TableHead>
                    <TableHead>图号</TableHead>
                    <TableHead>表面处理</TableHead>
                    <TableHead>备注</TableHead>
                    {/* 添加操作列标题 */}
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqItems.map((item) => (
                    <TableRow key={item.id} className={selectedItems.includes(item.id) ? "bg-muted/50" : ""}>
                      {isEditMode && (
                        <TableCell>
                          <Checkbox 
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => toggleItemSelection(item.id, checked as boolean)}
                          />
                        </TableCell>
                      )}
                      <TableCell>{item.index_no || '-'}</TableCell>
                      <TableCell>{item.part_number || '-'}</TableCell>
                      <TableCell>{item.name || '-'}</TableCell>
                      <TableCell>{item.quantity || '-'}</TableCell>
                      <TableCell>{item.material || '-'}</TableCell>
                      <TableCell>{item.process || '-'}</TableCell>
                      <TableCell>{item.delivery_time || '-'}</TableCell>
                      <TableCell>{item.unit || '-'}</TableCell>
                      <TableCell>{item.tolerance || '-'}</TableCell>
                      <TableCell>{item.drawing_url || '-'}</TableCell>
                      <TableCell>{item.surface_finish || '-'}</TableCell>
                      <TableCell>{item.remarks || '-'}</TableCell>
                      {/* 添加操作列 */}
                      <TableCell>
                        {!isEditMode && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditDialog(item)}
                            className="h-7 px-2"
                            disabled={selectedProject?.status === 'archived'}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            View/Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* 删除确认对话框 */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除零件</AlertDialogTitle>
              <AlertDialogDescription>
                您正在删除 {selectedItems.length} 个零件，此操作不可撤销。
                <br />
                请输入 <span className="font-bold">delete</span> 确认删除：
                <Input 
                  className="mt-2"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteSelectedItems}
                disabled={deleteConfirmText !== 'delete'}
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };

  // 加载邮件历史
  const fetchEmailHistory = async () => {
    if (!selectedProject) return;
    
    setLoadingEmails(true);
    try {
      const token = await getAuthToken();
      const options = createRequestOptions('GET', token, null, organizationId);
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProject.id}/history`, options);
      
      if (!response.ok) {
        throw new Error('Failed to fetch email history');
      }
      
      const data = await response.json();
      setEmailHistories(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load email history',
        variant: "destructive",
      });
    } finally {
      setLoadingEmails(false);
    }
  };
  
  // 加载供应商列表
  const fetchSuppliers = async () => {
    console.log('开始获取供应商列表');
    setLoadingSuppliers(true);
    try {
      const token = await getAuthToken();
      const options = createRequestOptions('GET', token, null, organizationId);
      console.log('请求供应商API，组织ID:', organizationId);
      
      const response = await fetch(`${API_BASE_URL}/suppliers`, options);
      
      if (!response.ok) {
        throw new Error(`获取供应商失败: ${response.status} ${response.statusText}`);
      }
      
      const rawData = await response.json();
      console.log('供应商API返回数据:', rawData);
      
      // 处理返回的供应商数据
      let suppliersList: Supplier[] = [];
      
      if (Array.isArray(rawData)) {
        // 直接是数组
        suppliersList = rawData;
      } else if (rawData.items && Array.isArray(rawData.items)) {
        // 是包含items数组的对象
        suppliersList = rawData.items;
      } else if (typeof rawData === 'object' && rawData !== null) {
        // 尝试将对象转换为数组
        suppliersList = Object.values(rawData).filter(item => typeof item === 'object') as Supplier[];
      }
      
      console.log('处理后的供应商列表:', suppliersList);
      setSuppliers(suppliersList);
    } catch (error) {
      console.error('获取供应商失败:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load suppliers',
        variant: "destructive",
      });
    } finally {
      setLoadingSuppliers(false);
    }
  };
  
  // 加载会话列表
  const fetchConversations = async () => {
    if (!selectedProject) return;
    
    setLoadingConversations(true);
    try {
      const token = await getAuthToken();
      const options = createRequestOptions('GET', token, null, organizationId);
      const response = await fetch(`${API_BASE_URL}/conversations?project_id=${selectedProject.id}`, options);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data.items || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load conversations',
        variant: "destructive",
      });
    } finally {
      setLoadingConversations(false);
    }
  };
  
  // 关闭会话
  const closeConversation = async (conversationId: string) => {
    try {
      const token = await getAuthToken();
      const options = createRequestOptions('POST', token, null, organizationId);
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/close`, options);
      
      if (!response.ok) {
        throw new Error('无法关闭会话');
      }
      
      toast({
        title: "成功",
        description: "会话已关闭",
        variant: "default",
      });
      
      // 刷新会话列表
      fetchConversations();
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : '无法关闭会话',
        variant: "destructive",
      });
    }
  };
  
  // 归档会话
  const archiveConversation = async (conversationId: string) => {
    try {
      const token = await getAuthToken();
      const options = createRequestOptions('POST', token, null, organizationId);
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/archive`, options);
      
      if (!response.ok) {
        throw new Error('无法归档会话');
      }
      
      toast({
        title: "成功",
        description: "会话已归档",
        variant: "default",
      });
      
      // 刷新会话列表
      fetchConversations();
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : '无法归档会话',
        variant: "destructive",
      });
    }
  };
  
  // 重新打开会话
  const reopenConversation = async (conversationId: string) => {
    try {
      const token = await getAuthToken();
      const options = createRequestOptions('POST', token, null, organizationId);
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/reopen`, options);
      
      if (!response.ok) {
        throw new Error('无法重新打开会话');
      }
      
      toast({
        title: "成功",
        description: "会话已重新打开",
        variant: "default",
      });
      
      // 刷新会话列表
      fetchConversations();
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : '无法重新打开会话',
        variant: "destructive",
      });
    }
  };
  
  // 发送邮件
  const sendEmail = async () => {
    if (!selectedProject) return;
    
    // 验证邮件字段
    if (!emailForm.to_email) {
      toast({
        title: "Error",
        description: "Recipient email is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!emailForm.subject) {
      toast({
        title: "Error",
        description: "Subject is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!emailForm.content) {
      toast({
        title: "Error",
        description: "Email content is required",
        variant: "destructive",
      });
      return;
    }
    
    setEmailSending(true);
    try {
      const token = await getAuthToken();
      
      // 准备邮件数据
      const emailData = {
        project_id: selectedProject.id,
        to_email: emailForm.to_email,
        subject: emailForm.subject,
        content: emailForm.content,
        cc_email: emailForm.cc_email ? emailForm.cc_email.split(',').map(e => e.trim()) : [],
        bcc_email: emailForm.bcc_email ? emailForm.bcc_email.split(',').map(e => e.trim()) : [],
        conversation_id: emailForm.conversation_id,
        rfq_item_ids: emailForm.rfq_item_ids
      };
      
      // 如果没有会话ID但有选择的供应商，添加供应商ID
      if (selectedSupplier && !emailForm.conversation_id) {
        Object.assign(emailData, { supplier_id: selectedSupplier.id });
      }
      
      // 使用FormData来处理文件上传和JSON数据
      const formData = new FormData();
      
      // 添加JSON数据
      formData.append('email_data_str', JSON.stringify(emailData));
      
      // 添加附件
      if (emailAttachments.length > 0) {
        emailAttachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }
      
      // 创建请求选项
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        } as Record<string, string>,
        body: formData,
        credentials: 'include' as RequestCredentials
      };
      
      // 如果有组织ID，添加到请求头中
      if (organizationId) {
        options.headers['X-Organization-ID'] = organizationId;
      }
      
      // 发送请求
      console.log('发送邮件...');
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProject.id}/send`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send email');
      }
      
      // 处理成功响应
      toast({
        title: "Success",
        description: "Email sent successfully",
        variant: "default",
      });
      
      // 关闭对话框并重置表单
      setEmailDialogOpen(false);
      resetEmailForm();
      
      // 更新邮件历史和会话列表
      fetchEmailHistory();
      fetchConversations();
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: "destructive",
      });
    } finally {
      setEmailSending(false);
    }
  };
  
  // 重置邮件表单
  const resetEmailForm = () => {
    setEmailForm({
      to_email: '',
      subject: '',
      content: '',
      cc_email: '',
      bcc_email: '',
      conversation_id: null,
      rfq_item_ids: []
    });
    setEmailAttachments([]);
    setSelectedSupplier(null);
  };
  
  // 处理邮件附件变更
  const handleEmailAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setEmailAttachments(prev => [...prev, ...filesArray]);
    }
  };
  
  // 移除邮件附件
  const removeEmailAttachment = (index: number) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // 打开编辑邮件对话框
  const openEmailDialog = async (templateData?: { subject: string, content: string }) => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }
    
    // 如果提供了模板数据，使用它
    if (templateData) {
      setEmailForm(prev => ({
        ...prev,
        subject: templateData.subject,
        content: templateData.content,
        rfq_item_ids: selectedItems
      }));
    }
    
    // 加载供应商列表
    if (suppliers.length === 0) {
      await fetchSuppliers();
    }
    
    setEmailDialogOpen(true);
  };

  // 在项目选择后加载邮件数据
  useEffect(() => {
    if (selectedProject && currentTab === "emails") {
      fetchEmailHistory();
      fetchConversations();
    }
  }, [selectedProject, currentTab]);

  // 在标签切换到邮件时加载数据
  useEffect(() => {
    if (currentTab === "emails" && selectedProject) {
      fetchEmailHistory();
      fetchConversations();
    }
  }, [currentTab]);

  // 渲染邮件标签页内容
  const renderEmails = () => {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* 注释掉重复的项目选择器
            <ProjectCombobox 
              projects={projects}
              selectedProject={selectedProject}
              onSelect={selectProject}
              className="min-w-[250px]"
            />
            */}
            <div className="flex items-center">
              <h2 className="text-xl font-semibold">
                Inquiry Emails
              </h2>
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                selectedProject?.status === 'open' ? 'bg-green-100 text-green-800' :
                selectedProject?.status === 'closed' ? 'bg-red-100 text-red-800' :
                selectedProject?.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedProject?.status ? selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1) : 'Draft'}
              </span>
            </div>
          </div>
          <Button onClick={() => { resetEmailForm(); openEmailDialog(); }}>
            <Mail className="mr-2 h-4 w-4" /> Compose Email
          </Button>
        </div>

        {/* 邮件和会话标签 */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="history">Email History</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            {loadingEmails ? (
              <div className="flex flex-col space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="w-full">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/6" />
                      </div>
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : emailHistories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No emails yet</h3>
                <p className="text-muted-foreground mt-1">
                  Start by generating an inquiry email template
                </p>
                <Button 
                  className="mt-4" 
                  onClick={generateAndSendEmail}
                  disabled={rfqItems.length === 0}
                >
                  <Mail className="mr-2 h-4 w-4" /> Generate Email Template
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {emailHistories.map((email) => (
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
          
          <TabsContent value="conversations" className="space-y-4">
            {loadingConversations ? (
              <div className="flex flex-col space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="w-full">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/6" />
                      </div>
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No conversations yet</h3>
                <p className="text-muted-foreground mt-1">
                  Conversations are created when you send emails to suppliers
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <Card key={conversation.id} className="w-full">
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{conversation.supplier_name || 'Supplier'}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              conversation.status === 'open' ? 'bg-green-100 text-green-800' :
                              conversation.status === 'closed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Last activity: {format(new Date(conversation.last_activity), 'yyyy-MM-dd HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>{conversation.supplier_email || 'No email'}</span>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            // 查看会话详情，可以实现详细页面
                            fetchConversationDetails(conversation.id);
                          }}>
                            <Search className="mr-1 h-3 w-3" /> View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            // 打开邮件编辑对话框，指定会话ID
                            setEmailForm(prev => ({
                              ...prev,
                              to_email: conversation.supplier_email || '',
                              subject: `Re: Project ${selectedProject?.name} Inquiry`,
                              conversation_id: conversation.id,
                            }));
                            setEmailDialogOpen(true);
                          }}>
                            <Mail className="mr-1 h-3 w-3" /> Send Email
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <RefreshCw className="mr-1 h-3 w-3" /> Status
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => reopenConversation(conversation.id)}
                                disabled={conversation.status === 'open'}
                              >
                                <Check className="mr-1 h-3 w-3 text-green-500" /> 标记为开放
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => closeConversation(conversation.id)}
                                disabled={conversation.status === 'closed'}
                              >
                                <X className="mr-1 h-3 w-3 text-red-500" /> 标记为关闭
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => archiveConversation(conversation.id)}
                                disabled={conversation.status === 'archived'}
                              >
                                <Archive className="mr-1 h-3 w-3 text-gray-500" /> 归档
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </>
    );
  };

  // 加载会话详情
  const fetchConversationDetails = async (conversationId: string) => {
    setLoadingConversationDetails(true);
    try {
      const token = await getAuthToken();
      const options = createRequestOptions('GET', token, null, organizationId);
      
      // 获取会话详情
      const detailResponse = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, options);
      if (!detailResponse.ok) {
        throw new Error('无法获取会话详情');
      }
      const conversationDetail = await detailResponse.json();
      setSelectedConversation(conversationDetail);
      
      // 获取会话关联的邮件
      const emailsResponse = await fetch(`${API_BASE_URL}/conversations/${conversationId}/emails`, options);
      if (!emailsResponse.ok) {
        throw new Error('无法获取会话邮件记录');
      }
      const emailsData = await emailsResponse.json();
      console.log('获取到的邮件数据:', emailsData);
      setConversationEmails(emailsData || []);
      
      // 获取会话关联的RFQ零件
      const itemsResponse = await fetch(`${API_BASE_URL}/conversations/${conversationId}/rfq-items`, options);
      if (!itemsResponse.ok) {
        throw new Error('无法获取会话关联零件');
      }
      const itemsData = await itemsResponse.json();
      console.log('获取到的零件数据:', itemsData);
      setConversationItems(itemsData || []);
      
      // 打开对话框
      setConversationDialogOpen(true);
    } catch (error) {
      console.error('获取会话详情错误:', error);
      toast({
        title: "获取详情失败",
        description: error instanceof Error ? error.message : '无法获取会话详情',
        variant: "destructive",
      });
    } finally {
      setLoadingConversationDetails(false);
    }
  };

  // 在RfqPage函数中添加这两个处理函数
  const handleReplyEmail = (email: EmailHistory) => {
    setEmailForm(prev => ({
      ...prev,
      to_email: email.to_email,
      subject: `Re: ${email.subject}`,
      content: `\n\n--------- 原始邮件 ---------\n${email.content || ''}`,
      conversation_id: email.conversation_id
    }));
    setEmailDialogOpen(true);
  };

  const handleForwardEmail = (email: EmailHistory) => {
    setEmailForm(prev => ({
      ...prev,
      to_email: '',
      subject: `Fwd: ${email.subject}`,
      content: `\n\n--------- 转发邮件 ---------\n发件人: ${email.to_email}\n主题: ${email.subject}\n\n${email.content || ''}`,
      conversation_id: null // 创建新的会话
    }));
    setEmailDialogOpen(true);
  };

  // 从全局projectId同步到本地selectedProject
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // 如果找到匹配的项目，更新selectedProject
        setSelectedProject(project);
        // 加载该项目的文件和零件
        fetchRfqFiles(projectId);
      }
    }
  }, [projectId, projects]);

  // 监听全局projectId的变化
  useEffect(() => {
    console.log('全局项目ID变化:', projectId);
    // 如果已有项目ID但没有本地selectedProject，
    // 且projects数组已加载，尝试根据ID找到对应的项目
    if (projectId && !selectedProject && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        console.log('根据全局ID找到项目:', project.name);
        setSelectedProject(project);
        fetchRfqFiles(projectId);
      }
    }
  }, [projectId]);

  // 处理项目搜索
  const handleProjectSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectSearchTerm(e.target.value);
  };

  // 过滤项目
  const filteredProjects = projects.filter(project => {
    // 搜索条件过滤
    const matchesSearch = project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) || 
                         (project.description && project.description.toLowerCase().includes(projectSearchTerm.toLowerCase()));
    
    // 状态过滤
    const matchesStatus = !projectFilterStatus || project.status === projectFilterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // 创建新项目
  const handleCreateProject = async () => {
    try {
      const token = await getAuthToken();
      
      if (!newProjectForm.name.trim()) {
        toast({
          title: "Error",
          description: "Project name is required",
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
        throw new Error('Failed to create project');
      }
      
      const newProject = await response.json();
      
      // 更新项目列表
      fetchProjects();
      
      // 重置表单并关闭对话框
      setNewProjectForm({
        name: '',
        description: '',
        status: 'draft'
      });
      setCreateProjectDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: "destructive",
      });
    }
  };

  // 选择/取消选择所有项目
  const toggleSelectAllProjects = (checked: boolean) => {
    setAllProjectsSelected(checked);
    
    if (checked) {
      // 选择所有过滤后的项目
      setProjectsSelected(filteredProjects.map(p => p.id));
    } else {
      // 取消选择所有项目
      setProjectsSelected([]);
    }
  };
  
  // 选择/取消选择单个项目
  const toggleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setProjectsSelected(prev => [...prev, projectId]);
    } else {
      setProjectsSelected(prev => prev.filter(id => id !== projectId));
    }
  };
  
  // 批量删除项目
  const deleteSelectedProjects = async () => {
    try {
      if (projectsSelected.length === 0) {
        return;
      }
      
      const token = await getAuthToken();
      
      // 这里模拟批量删除，实际上可能需要创建一个批量删除的API端点
      let successCount = 0;
      let errorCount = 0;
      
      // 逐个删除选中的项目
      for (const projectId of projectsSelected) {
        const options = createRequestOptions('DELETE', token, null, organizationId);
        
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, options);
        
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      }
      
      // 刷新项目列表
      fetchProjects();
      
      // 重置选择状态
      setProjectsSelected([]);
      setAllProjectsSelected(false);
      setShowProjectDeleteDialog(false);
      
      if (errorCount > 0) {
        toast({
          title: "Partial Success",
          description: `Deleted ${successCount} projects, failed to delete ${errorCount} projects`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully deleted ${successCount} projects`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete projects',
        variant: "destructive",
      });
    }
  };
  
  // 处理表单输入变化
  // const handleEditInputChange = (field: keyof RfqItem, value: string | number | null) => {
  //   setEditFormData(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  // };
  
  // 开始编辑
  // const startEditing = (item: RfqItem) => {
  //   setEditingItem(item.id);
  //   setEditFormData({
  //     index_no: item.index_no,
  //     part_number: item.part_number,
  //     name: item.name,
  //     quantity: item.quantity,
  //     material: item.material,
  //     size: item.size,
  //     process: item.process,
  //     delivery_time: item.delivery_time,
  //     unit: item.unit,
  //     tolerance: item.tolerance,
  //     drawing_url: item.drawing_url,
  //     surface_finish: item.surface_finish,
  //     remarks: item.remarks
  //   });
  // };
  
  // 取消编辑
  // const cancelEditing = () => {
  //   setEditingItem(null);
  //   setEditFormData({});
  // };

  // 打开编辑弹窗
  const openEditDialog = (item: RfqItem) => {
    setItemToEdit({...item});
    setEditDialogOpen(true);
  };
  
  // 关闭编辑弹窗
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setItemToEdit(null);
  };
  
  // 处理编辑表单字段变化
  // const handleEditChange = (field: keyof RfqItem, value: string | number | null) => {
  //   if (itemToEdit) {
  //     setItemToEdit({
  //       ...itemToEdit,
  //       [field]: value
  //     });
  //   }
  // };
  
  // 保存编辑 - 重命名函数
  const handleSaveEdit = async (updatedItem: RfqItem) => {
    try {
      setIsUpdating(true);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("认证失败");
      }
      
      // 确保有项目ID
      if (!selectedProject || !selectedProject.id) {
        throw new Error("未选择项目或项目ID无效");
      }
      
      // 创建请求数据，排除不需要更新的字段
      const updateData = {
        index_no: updatedItem.index_no,
        part_number: updatedItem.part_number,
        name: updatedItem.name,
        quantity: updatedItem.quantity,
        material: updatedItem.material,
        size: updatedItem.size,
        process: updatedItem.process,
        delivery_time: updatedItem.delivery_time,
        unit: updatedItem.unit,
        tolerance: updatedItem.tolerance,
        drawing_url: updatedItem.drawing_url,
        surface_finish: updatedItem.surface_finish,
        remarks: updatedItem.remarks
      };
      
      // 创建请求选项
      const options = createRequestOptions('PATCH', token, updateData);
      
      // 发送更新请求 - 修改API路径，包含项目ID
      const response = await fetch(`${API_BASE_URL}/projects/rfq-items/${updatedItem.id}`, options);
      
      if (!response.ok) {
        throw new Error(`更新失败: ${response.status}`);
      }
      
      // 获取更新后的数据
      const responseData = await response.json();
      
      // 更新本地数据
      setRfqItems(rfqItems.map(item => 
        item.id === updatedItem.id ? { ...item, ...responseData } : item
      ));
      
      // 显示成功通知
      toast({
        title: "更新成功",
        description: "零件信息已更新",
      });
      
      // 关闭弹窗
      closeEditDialog();
    } catch (error) {
      console.error('更新零件信息失败:', error);
      toast({
        variant: "destructive",
        title: "更新失败",
        description: error instanceof Error ? error.message : "更新零件信息时出错",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Toaster />
      <SonnerToaster position="top-right" expand={false} closeButton richColors />
      
      <h1 className="text-3xl font-bold mb-6">RFQ Management</h1>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger 
            value="files" 
            disabled={!selectedProject}
          >
            RFQ Files
          </TabsTrigger>
          <TabsTrigger 
            value="items" 
            disabled={!selectedProject}
          >
            Parts List
          </TabsTrigger>
          <TabsTrigger 
            value="emails" 
            disabled={!selectedProject}
          >
            Email History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="focus-visible:outline-none">
          <Card>
            <CardContent className="p-6">
              {renderProjects()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="files" className="focus-visible:outline-none">
          <Card>
            <CardContent className="p-6">
              {renderRfqFiles()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="items" className="focus-visible:outline-none">
          <Card>
            <CardContent className="p-6">
              {renderRfqItems()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="emails" className="focus-visible:outline-none">
          <Card>
            <CardContent className="p-6">
              {renderEmails()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 文件上传对话框 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload RFQ File</DialogTitle>
            <DialogDescription>
              Upload a RFQ file to extract part information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rfq-file" className="col-span-4">
                Select File
              </Label>
              <Input
                id="rfq-file"
                type="file"
                className="col-span-4"
                onChange={handleFileChange}
                ref={fileInputRef}
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={!selectedFile || fileUploading}>
              {fileUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 供应商选择对话框 */}
      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Supplier</DialogTitle>
            <DialogDescription>
              Select a supplier to send the inquiry email
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {loadingSuppliers ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : suppliers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No suppliers found</AlertTitle>
                <AlertDescription>
                  Please add suppliers first
                </AlertDescription>
              </Alert>
            ) : (
              suppliers.map(supplier => (
                <Card key={supplier.id} className="relative cursor-pointer hover:bg-accent">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{supplier.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {supplier.contact_name ? `Contact: ${supplier.contact_name}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.email}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          generateTemplate(supplier.id);
                        }}
                        disabled={templateGenerating}
                      >
                        {templateGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Mail className="mr-2 h-4 w-4" /> Generate Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupplierDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 邮件发送对话框 */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="w-full max-w-3xl">
          <DialogHeader>
            <DialogTitle>Send Inquiry Email</DialogTitle>
            <DialogDescription>
              Send an inquiry email to suppliers
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="to_email">To</Label>
              <Input
                id="to_email"
                name="to_email"
                value={emailForm.to_email}
                onChange={(e) => setEmailForm({...emailForm, to_email: e.target.value})}
                placeholder="supplier@example.com"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="cc_email">CC</Label>
              <Input
                id="cc_email"
                name="cc_email"
                value={emailForm.cc_email}
                onChange={(e) => setEmailForm({...emailForm, cc_email: e.target.value})}
                placeholder="cc@example.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bcc_email">BCC</Label>
              <Input
                id="bcc_email"
                name="bcc_email"
                value={emailForm.bcc_email}
                onChange={(e) => setEmailForm({...emailForm, bcc_email: e.target.value})}
                placeholder="bcc@example.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                placeholder="RFQ Request: Project Name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                value={emailForm.content}
                onChange={(e) => setEmailForm({...emailForm, content: e.target.value})}
                placeholder="Email content"
                className="min-h-[200px]"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Attachments</Label>
              <div className="flex flex-col space-y-2">
                <Input
                  type="file"
                  onChange={handleEmailAttachmentChange}
                  multiple
                />
                {emailAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {emailAttachments.map((file, index) => (
                      <Badge key={index} className="flex items-center gap-1">
                        {file.name}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => removeEmailAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEmailDialogOpen(false);
              resetEmailForm();
            }}>
              Cancel
            </Button>
            <Button onClick={sendEmail} disabled={emailSending}>
              {emailSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 会话详情对话框 */}
      <Dialog open={conversationDialogOpen} onOpenChange={setConversationDialogOpen}>
        <DialogContent className="w-full max-w-6xl flex flex-col h-[85vh] max-h-[800px]">
          <DialogHeader className="pb-2 shrink-0">
            <DialogTitle>会话详情</DialogTitle>
            <DialogDescription>
              与供应商的沟通历史和询价进度
            </DialogDescription>
          </DialogHeader>

          {loadingConversationDetails ? (
            <div className="flex justify-center items-center p-6 flex-grow">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedConversation && (
            <div className="flex flex-col flex-grow overflow-hidden h-full">
              {/* 上部分布局：会话信息和供应商信息 */}
              <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
                {/* 会话详情卡片 */}
                <div className="col-span-2">
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">会话状态</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">项目</div>
                          <div className="font-medium">{selectedConversation.project_name || '未知项目'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">状态</div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              selectedConversation.status === 'open' ? 'bg-green-100 text-green-800' :
                              selectedConversation.status === 'closed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedConversation.status === 'open' ? '进行中' : 
                               selectedConversation.status === 'closed' ? '已关闭' : '已归档'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">创建于</div>
                          <div className="font-medium">{format(new Date(selectedConversation.created_at), 'yyyy-MM-dd HH:mm')}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">最后活动</div>
                          <div className="font-medium">{format(new Date(selectedConversation.last_activity), 'yyyy-MM-dd HH:mm')}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* 供应商信息卡片 */}
                <div className="col-span-1">
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">供应商信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <div className="text-sm text-muted-foreground">名称</div>
                        <div className="font-medium">{selectedConversation.supplier_name || '未知供应商'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">邮箱</div>
                        <div className="font-medium">{selectedConversation.supplier_email || '无邮箱信息'}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 标签页导航和内容区域 - 使用flex-grow和min-height确保灵活适应 */}
              <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
                <Tabs defaultValue="emails" className="flex flex-col flex-grow min-h-0">
                  <TabsList className="w-full shrink-0">
                    <TabsTrigger value="emails">邮件历史</TabsTrigger>
                    <TabsTrigger value="items">关联零件</TabsTrigger>
                    <TabsTrigger value="status">报价状态</TabsTrigger>
                  </TabsList>
                  
                  {/* 邮件历史标签页 */}
                  <TabsContent value="emails" className="flex-grow overflow-y-auto mt-2">
                    {!conversationEmails || conversationEmails.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">暂无邮件记录</h3>
                        <p className="text-muted-foreground mt-1">
                          使用下方的"发送邮件"按钮开始与供应商沟通
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 p-2">
                        {conversationEmails.map((email) => (
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
                  
                  {/* 关联零件标签页 */}
                  <TabsContent value="items" className="flex-grow overflow-y-auto mt-2 h-[440px]">
                    {!conversationItems || conversationItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">暂无关联零件</h3>
                        <p className="text-muted-foreground mt-1">
                          发送邮件时可以选择关联零件以添加到此会话
                        </p>
                      </div>
                    ) : (
                      <div className="p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                          {conversationItems.map((item) => (
                            <Card key={item.id} className="overflow-hidden">
                              <CardHeader className="p-3 pb-2 bg-muted/50">
                                <CardTitle className="text-base flex items-center justify-between">
                                  <span className="truncate">{item.name || '未命名零件'}</span>
                                  {item.index_no && <Badge variant="outline">{`#${item.index_no}`}</Badge>}
                                </CardTitle>
                                {item.part_number && (
                                  <CardDescription className="truncate">{item.part_number}</CardDescription>
                                )}
                              </CardHeader>
                              <CardContent className="p-3">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">数量:</span>{' '}
                                    <span className="font-medium">{item.quantity || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">材料:</span>{' '}
                                    <span className="font-medium">{item.material || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">工艺:</span>{' '}
                                    <span className="font-medium">{item.process || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">交期:</span>{' '}
                                    <span className="font-medium">{item.delivery_time || '-'}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* 报价状态标签页 */}
                  <TabsContent value="status" className="flex-grow overflow-y-auto mt-2">
                    <div className="mb-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">报价进度</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${conversationItems.length ? (0 / conversationItems.length) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-sm font-medium">
                              {`0/${conversationItems.length} 已报价`}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Alert className="mb-4">
                      <AlertTitle className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        提示
                      </AlertTitle>
                      <AlertDescription>
                        报价状态功能尚在开发中。请通过邮件跟进询价进度。
                      </AlertDescription>
                    </Alert>
                    
                    <div className="text-center text-muted-foreground p-8">
                      此处将显示零件的报价状态和金额信息
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* 底部操作栏 - 确保始终可见 */}
              <div className="mt-4 pt-3 flex justify-between items-center border-t border-border shrink-0">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setConversationDialogOpen(false)}
                  >
                    关闭
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="default"
                    onClick={() => {
                      // 打开邮件编辑对话框，指定会话ID
                      setEmailForm(prev => ({
                        ...prev,
                        to_email: selectedConversation.supplier_email || '',
                        subject: `Re: ${selectedConversation.project_name || 'Project'} Inquiry`,
                        conversation_id: selectedConversation.id,
                      }));
                      setConversationDialogOpen(false);
                      setEmailDialogOpen(true);
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    发送邮件
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" /> 状态
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => reopenConversation(selectedConversation.id)}
                        disabled={selectedConversation.status === 'open'}
                      >
                        <Check className="mr-2 h-4 w-4 text-green-500" /> 标记为开放
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => closeConversation(selectedConversation.id)}
                        disabled={selectedConversation.status === 'closed'}
                      >
                        <X className="mr-2 h-4 w-4 text-red-500" /> 标记为关闭
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => archiveConversation(selectedConversation.id)}
                        disabled={selectedConversation.status === 'archived'}
                      >
                        <Archive className="mr-2 h-4 w-4 text-gray-500" /> 归档
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 创建项目对话框 */}
      <Dialog open={createProjectDialogOpen} onOpenChange={setCreateProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new project
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={newProjectForm.name}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                value={newProjectForm.description}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={newProjectForm.status}
                onValueChange={(value) => setNewProjectForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 删除项目确认对话框 */}
      <AlertDialog open={showProjectDeleteDialog} onOpenChange={setShowProjectDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Projects</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {projectsSelected.length} projects? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelectedProjects}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 添加编辑弹窗 */}
      <PartEditDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setItemToEdit(null);
          }
        }}
        item={itemToEdit}
        onSave={handleSaveEdit}
        isSaving={isUpdating}
      />
    </div>
  );
} 