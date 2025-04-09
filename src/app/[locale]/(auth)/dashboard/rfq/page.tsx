'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Loader2, FileText, Upload, Mail, FileUp, Search, AlertCircle, RefreshCw, Download,
  ChevronRight, MoreHorizontal, FilePlus, FileQuestion, ListFilter, SortAsc, UploadCloud
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useApiWithOrganization, API_BASE_URL, createRequestOptions } from '@/utils/api';

// 数据类型定义
interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

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
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export default function RfqPage() {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { organizationId } = useApiWithOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [rfqFiles, setRfqFiles] = useState<RfqFile[]>([]);
  const [rfqItems, setRfqItems] = useState<RfqItem[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState("projects");
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    pages: 0
  });

  // 初始加载数据
  useEffect(() => {
    fetchProjects();
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
    setSelectedProject(project);
    setCurrentTab("files");
    await fetchRfqFiles(project.id);
  };

  // 获取项目的RFQ文件
  const fetchRfqFiles = async (projectId: string) => {
    try {
      const token = await getAuthToken();
      
      const options = createRequestOptions('GET', token, null, organizationId);
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/rfq-items`, options);
      
      if (!response.ok) {
        throw new Error('获取RFQ文件失败');
      }
      
      const data = await response.json();
      setRfqItems(data);
      
      // 此处假设存在获取RFQ文件的API端点
      // 如果不存在，需要先实现后端API
      // const filesResponse = await fetch(`${API_BASE_URL}/projects/${projectId}/rfq-files`, options);
      // if (filesResponse.ok) {
      //   const filesData = await filesResponse.json();
      //   setRfqFiles(filesData);
      // }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get RFQ data',
        variant: "destructive",
      });
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
    if (!selectedProject || !selectedFile) {
      toast({
        title: "Error",
        description: "Please select a project and a file first",
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
        body: formData,
        credentials: 'include'
      };

      // 如果有组织ID，添加到请求头
      if (organizationId) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'X-Org-Id': organizationId
        };
      }

      const response = await fetch(`${API_BASE_URL}/projects/${selectedProject.id}/upload-rfq`, requestOptions);
      
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
    if (!selectedProject) {
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
      
      const options = createRequestOptions('POST', token, {
        file_id: fileId
      }, organizationId);
      
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProject.id}/parse-rfq`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'RFQ解析失败');
      }
      
      const data = await response.json();
      
      toast({
        title: "Parse successful",
        description: `Successfully parsed ${data.items.length} parts`,
        variant: "default",
      });
      
      // 更新零件列表并切换到零件标签
      setRfqItems(data.items);
      setCurrentTab("items");
      
    } catch (error) {
      toast({
        title: "Parse failed",
        description: error instanceof Error ? error.message : 'An error occurred during RFQ parsing',
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  // 生成并发送询价邮件
  const generateAndSendEmail = async () => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await getAuthToken();
      
      // 1. 生成邮件模板
      const templateOptions = createRequestOptions('POST', token, null, organizationId);
      const templateResponse = await fetch(`${API_BASE_URL}/projects/${selectedProject.id}/generate-template`, templateOptions);
      
      if (!templateResponse.ok) {
        const errorData = await templateResponse.json();
        throw new Error(errorData.detail || '邮件模板生成失败');
      }
      
      
      // 在此处可以添加发送邮件的逻辑，例如打开发送邮件的对话框，
      // 显示生成的模板内容，并允许用户编辑后发送
      // ...
      
      toast({
        title: "Template generated successfully",
        description: "Email template has been generated. Please go to the Email tab to view",
        variant: "default",
      });
      
    } catch (error) {
      toast({
        title: "Template generation failed",
        description: error instanceof Error ? error.message : 'An error occurred during email template generation',
        variant: "destructive",
      });
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
              Create your first project to start the RFQ process
            </p>
            <Button asChild>
              <Link href="/dashboard/projects">
                Create Project
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    // 过滤项目
    const filteredProjects = searchTerm
      ? projects.filter(project => 
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : projects;

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8 w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/dashboard/projects">
              <FilePlus className="mr-2 h-4 w-4" /> New Project
            </Link>
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.description || '-'}</TableCell>
                  <TableCell>{format(new Date(project.created_at), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => selectProject(project)}>
                      Select <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center space-x-2 py-4">
            <Button
              variant="outline"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.pages || isLoading}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </>
    );
  };

  // 渲染RFQ文件列表
  const renderRfqFiles = () => {
    if (!selectedProject) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Please select a project first</AlertTitle>
          <AlertDescription>
            You need to select a project before managing RFQ files
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{selectedProject.name} - RFQ Files</h2>
          <Button onClick={() => setUploadDialogOpen(true)}>
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
                          onClick={() => {/* 下载文件 */}}
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Please select a project first</AlertTitle>
          <AlertDescription>
            You need to select a project to view the parts list
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{selectedProject.name} - Parts List</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setCurrentTab("files")}>
              <Upload className="mr-2 h-4 w-4" /> Manage RFQ Files
            </Button>
            <Button onClick={generateAndSendEmail} disabled={rfqItems.length === 0}>
              <Mail className="mr-2 h-4 w-4" /> Generate Inquiry Email
            </Button>
          </div>
        </div>

        {rfqItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 border rounded-md">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No Parts Data</h3>
              <p className="text-sm text-muted-foreground">
                Upload and parse RFQ files to get parts information
              </p>
              <Button onClick={() => setCurrentTab("files")}>
                <Upload className="mr-2 h-4 w-4" /> Manage RFQ Files
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                Total: {rfqItems.length} parts
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <ListFilter className="mr-1 h-4 w-4" /> Filter
                </Button>
                <Button variant="outline" size="sm">
                  <SortAsc className="mr-1 h-4 w-4" /> Sort
                </Button>
              </div>
            </div>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Process</TableHead>
                    <TableHead>Delivery Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.index_no || index + 1}</TableCell>
                      <TableCell className="font-medium">{item.part_number || '-'}</TableCell>
                      <TableCell>{item.name || '-'}</TableCell>
                      <TableCell>{item.quantity || '-'}</TableCell>
                      <TableCell>{item.material || '-'}</TableCell>
                      <TableCell>{item.process || '-'}</TableCell>
                      <TableCell>{item.delivery_time || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {/* 编辑零件 */}}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">RFQs</CardTitle>
          <CardDescription>
            Manage Request For Quotations (RFQs), parse part information and send inquiry emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="files" disabled={!selectedProject}>RFQ Files</TabsTrigger>
              <TabsTrigger value="items" disabled={!selectedProject}>Parts List</TabsTrigger>
              <TabsTrigger value="emails" disabled={!selectedProject}>Inquiry Emails</TabsTrigger>
            </TabsList>
            <TabsContent value="projects" className="space-y-4">
              {renderProjects()}
            </TabsContent>
            <TabsContent value="files" className="space-y-4">
              {renderRfqFiles()}
            </TabsContent>
            <TabsContent value="items" className="space-y-4">
              {renderRfqItems()}
            </TabsContent>
            <TabsContent value="emails" className="space-y-4">
              <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Email functionality coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 文件上传对话框 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload RFQ File</DialogTitle>
            <DialogDescription>
              Upload RFQ files to start the inquiry process. Supported formats: PDF, Excel, Images.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Select file:
              </label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFileUpload} 
              disabled={!selectedFile || fileUploading}
            >
              {fileUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  );
} 