'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Folder, Search } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useApiWithOrganization, API_BASE_URL, createRequestOptions } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/Helpers';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Project {
  id: string;
  name: string;
  status?: string;
  description?: string;
}

// 本地存储的键名
const STORAGE_KEY = 'smartrfq_selected_project';

export function ProjectSelector() {
  const { projectId, setProjectId } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const { organizationId } = useApiWithOrganization();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // 处理popover状态变化
  const handleOpenChange = (open: boolean) => {
    console.log('Popover状态变化:', open);
    setOpen(open);
    // 关闭时清空搜索框
    if (!open) {
      setSearch('');
    }
  };

  // 从本地存储加载已选项目ID
  useEffect(() => {
    if (!projectId) {
      try {
        const savedProjectId = localStorage.getItem(STORAGE_KEY);
        if (savedProjectId) {
          console.log('ProjectSelector: 从本地存储加载项目ID:', savedProjectId);
          setProjectId(savedProjectId);
        }
      } catch (error) {
        console.error('从本地存储获取项目ID失败:', error);
      }
    }
  }, []);

  // 当项目ID变化时保存到本地存储
  useEffect(() => {
    if (projectId) {
      try {
        localStorage.setItem(STORAGE_KEY, projectId);
        console.log('ProjectSelector: 项目ID已保存到本地存储:', projectId);
      } catch (error) {
        console.error('保存项目ID到本地存储失败:', error);
      }
    }
  }, [projectId]);

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      if (!organizationId) {
        console.log('等待组织ID...');
        return;
      }
      
      setLoading(true);
      console.log('ProjectSelector: 开始加载项目列表, 当前projectId:', projectId);
      
      try {
        const token = await getToken();
        if (!token) return;

        const options = createRequestOptions('GET', token, null, organizationId);
        const response = await fetch(`${API_BASE_URL}/projects?page=1&page_size=100`, options);
        
        if (!response.ok) {
          throw new Error('获取项目列表失败');
        }
        
        const data = await response.json();
        const projectsList = data.items || [];
        setProjects(projectsList);
        console.log('ProjectSelector: 项目列表加载完成，共', projectsList.length, '个项目');
        
        // 如果没有选择项目，且本地存储中也没有项目ID，且有项目列表，则默认选择第一个
        const savedProjectId = localStorage.getItem(STORAGE_KEY);
        
        if (savedProjectId && !projectsList.some((p: Project) => p.id === savedProjectId)) {
          console.log('ProjectSelector: 存储的项目ID不存在于项目列表中，重置为null');
          setProjectId(null);
        }
        if (!projectId && !savedProjectId && projectsList.length > 0) {
          console.log('ProjectSelector: 自动选择第一个项目:', projectsList[0].id);
          setProjectId(projectsList[0].id);
        }
        
        // 如果存储的项目ID不在当前项目列表中，则更新为第一个可用项目
        if (savedProjectId && projectsList.length > 0) {
          const projectExists = projectsList.some((p: Project) => p.id === savedProjectId);
          if (!projectExists) {
            console.log('ProjectSelector: 存储的项目ID不存在，更新为第一个项目:', projectsList[0].id);
            setProjectId(projectsList[0].id);
          }
        }
      } catch (error) {
        console.error('获取项目列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [organizationId]);

  // 处理项目变更
  const handleProjectChange = (value: string) => {
    console.log('ProjectSelector: 用户选择了新项目:', value);
    setProjectId(value);
    setOpen(false);
  };
  
  // 获取当前选中的项目
  const selectedProject = projects.find(p => p.id === projectId);

  // 过滤项目列表
  const filteredProjects = search 
    ? projects.filter(project => 
        project.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  // 渲染项目状态标签
  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    
    return (
      <Badge
        variant={
          status === 'open' ? 'default' :
          status === 'closed' ? 'destructive' :
          status === 'archived' ? 'secondary' : 'outline'
        }
        className="text-[10px] py-0 px-1.5 h-4"
      >
        {status === 'open' ? '进行中' :
         status === 'closed' ? '已关闭' :
         status === 'archived' ? '已归档' : 
         status === 'draft' ? '草稿' : status}
      </Badge>
    );
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[240px] justify-between pl-2 pr-3 h-9 truncate",
            open ? "border-primary/70 ring-1 ring-primary/20" : ""
          )}
          disabled={loading}
        >
          <div className="flex items-center gap-2 truncate max-w-full">
            <div className="rounded-full p-1 bg-primary/10 text-primary flex-shrink-0">
              <Folder className="h-3.5 w-3.5" />
            </div>
            <span className="truncate text-left">
              {selectedProject ? selectedProject.name : "选择项目..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-1" align="start">
        <div className="py-1.5 px-1.5">
          <Input
            placeholder="搜索项目名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-auto py-1">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              未找到项目
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectChange(project.id)}
                  className={cn(
                    "flex flex-col px-4 py-2 rounded-md",
                    "cursor-pointer hover:bg-muted",
                    projectId === project.id ? "bg-muted" : ""
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium text-sm w-full">
                      <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                        {projectId === project.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <span>{project.name}</span>
                    </div>
                    <div className="flex-shrink-0">
                      {renderStatusBadge(project.status)}
                    </div>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground pl-6">
                    {project.description || `get some ${project.name.toLowerCase()}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 