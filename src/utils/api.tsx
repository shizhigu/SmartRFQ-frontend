import { useOrganization } from "@clerk/nextjs";

export const API_BASE_URL = 'http://localhost:8003/api';

/**
 * 获取认证请求头，包括组织ID
 */
export const getAuthHeaders = (token: string, organizationId?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // 如果有组织ID，添加到请求头
  if (organizationId) {
    headers['X-Org-Id'] = organizationId;
  }
  
  return headers;
};

/**
 * 创建API请求的选项对象
 */
export const createRequestOptions = (
  method: string,
  token: string,
  body?: any,
  organizationId?: string
): RequestInit => {
  const options: RequestInit = {
    method,
    headers: getAuthHeaders(token, organizationId),
    credentials: 'include'
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  return options;
};

/**
 * 钩子函数: 使用Clerk组织ID的API请求
 */
export const useApiWithOrganization = () => {
  const { organization } = useOrganization();
  
  const fetchWithOrg = async (
    endpoint: string, 
    options: RequestInit,
    includeOrgId: boolean = true
  ) => {
    // 如果需要包含组织ID且有组织上下文
    if (includeOrgId && organization?.id && options.headers) {
      const headers = options.headers as Record<string, string>;
      headers['X-Org-Id'] = organization.id;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    return response;
  };
  
  return {
    fetchWithOrg,
    organizationId: organization?.id
  };
}; 