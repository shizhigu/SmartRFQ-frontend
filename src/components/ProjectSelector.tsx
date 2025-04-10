'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@clerk/nextjs';
import { useApiWithOrganization, API_BASE_URL, createRequestOptions } from '@/utils/api';

interface Project {
  id: string;
  name: string;
}

export function ProjectSelector() {
  const { projectId, setProjectId } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const { organizationId } = useApiWithOrganization();

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
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
        
        // 如果没有选择项目，且有项目列表，则默认选择第一个
        if (!projectId && projectsList.length > 0) {
          setProjectId(projectsList[0].id);
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
    setProjectId(value);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">当前项目:</span>
      <Select
        value={projectId || ''}
        onValueChange={handleProjectChange}
        disabled={loading || projects.length === 0}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="选择项目" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 