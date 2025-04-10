'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// 定义上下文类型
interface ProjectContextType {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
}

// 创建上下文
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// 创建 Provider 组件
export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projectId, setProjectId] = useState<string | null>(null);

  return (
    <ProjectContext.Provider value={{ projectId, setProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
};

// 自定义 hook 方便使用上下文
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  
  if (context === undefined) {
    throw new Error('useProject 必须在 ProjectProvider 内部使用');
  }
  
  return context;
}; 