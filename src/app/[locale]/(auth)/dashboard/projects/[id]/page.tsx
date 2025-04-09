'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Upload, FileText, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useApiWithOrganization, API_BASE_URL, createRequestOptions } from '@/utils/api';

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

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const { getToken } = useAuth();
  const { organizationId } = useApiWithOrganization();
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [rfqFiles, setRfqFiles] = useState<RfqFile[]>([]);
  const [rfqItems, setRfqItems] = useState<RfqItem[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchProjectDetails();
  }, [params.id, organizationId]);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    try {
      // 获取认证令牌
      const token = await getToken();
      if (!token) {
        throw new Error("无法获取认证令牌");
      }
      
      // 请求项目详情
      const projectOptions = createRequestOptions('GET', token, null, organizationId);
      const projectResponse = await fetch(`${API_BASE_URL}/projects/${params.id}`, projectOptions);
      
      if (!projectResponse.ok) {
        if (projectResponse.status === 404) {
          router.push('/dashboard/projects');
          return;
        }
        throw new Error('Failed to fetch project details');
      }
      
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // 请求RFQ文件
      try {
        const filesOptions = createRequestOptions('GET', token, null, organizationId);
        const filesResponse = await fetch(`${API_BASE_URL}/projects/${params.id}/rfq-files`, filesOptions);
        
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setRfqFiles(filesData);
        }
      } catch (error) {
        console.error('Error fetching RFQ files:', error);
      }
      
      // 请求RFQ条目
      try {
        const itemsOptions = createRequestOptions('GET', token, null, organizationId);
        const itemsResponse = await fetch(`${API_BASE_URL}/projects/${params.id}/rfq-items`, itemsOptions);
        
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setRfqItems(itemsData);
        }
      } catch (error) {
        console.error('Error fetching RFQ items:', error);
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load project details',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link 
          href="/dashboard/projects" 
          className="text-sm text-muted-foreground hover:text-foreground flex items-center"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
        </Link>
      </div>
      
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <CardDescription>
                {project.description || 'No description provided'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(project.created_at), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(new Date(project.updated_at), 'MMMM d, yyyy')}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-start gap-2 border-t pt-4">
            <Button asChild variant="outline">
              <Link href={`/dashboard/projects/${params.id}/upload`}>
                <Upload className="mr-2 h-4 w-4" /> Upload RFQ
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/projects/${params.id}/edit`}>
                Edit Project
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="files">RFQ Files</TabsTrigger>
                <TabsTrigger value="items">Parts List</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="overview" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Project Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Files</p>
                      <p className="font-medium">{rfqFiles.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Parts</p>
                      <p className="font-medium">{rfqItems.length}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
                  {rfqFiles.length > 0 ? (
                    <ul className="space-y-2">
                      {rfqFiles.slice(0, 3).map(file => (
                        <li key={file.id} className="flex items-center text-sm">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{file.filename}</span>
                          <span className="ml-2 text-muted-foreground">
                            - {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="files" className="mt-0">
              {rfqFiles.length > 0 ? (
                <ul className="divide-y">
                  {rfqFiles.map(file => (
                    <li key={file.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded on {format(new Date(file.uploaded_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/projects/${params.id}/files/${file.id}`}>
                          View <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-10 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No files uploaded</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an RFQ file to get started
                  </p>
                  <Button asChild>
                    <Link href={`/dashboard/projects/${params.id}/upload`}>
                      <Upload className="mr-2 h-4 w-4" /> Upload RFQ
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="items" className="mt-0">
              {rfqItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 px-3 font-medium">No.</th>
                        <th className="py-2 px-3 font-medium">Part Number</th>
                        <th className="py-2 px-3 font-medium">Name</th>
                        <th className="py-2 px-3 font-medium">Quantity</th>
                        <th className="py-2 px-3 font-medium">Material</th>
                        <th className="py-2 px-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfqItems.map((item, index) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2 px-3">{item.index_no || index + 1}</td>
                          <td className="py-2 px-3">{item.part_number || '-'}</td>
                          <td className="py-2 px-3">{item.name || '-'}</td>
                          <td className="py-2 px-3">{item.quantity || '-'}</td>
                          <td className="py-2 px-3">{item.material || '-'}</td>
                          <td className="py-2 px-3">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/projects/${params.id}/items/${item.id}`}>
                                View <ChevronRight className="ml-1 h-4 w-4" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No parts found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload and parse an RFQ file to extract parts
                  </p>
                  <Button asChild>
                    <Link href={`/dashboard/projects/${params.id}/upload`}>
                      <Upload className="mr-2 h-4 w-4" /> Upload RFQ
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 