import { API_BASE_URL } from "./api";

/**
 * 会话邮件服务 - 提供与会话式邮件系统交互的函数
 */
export class EmailConversationService {
  /**
   * 生成邮件模板
   * 
   * @param projectId 项目ID
   * @param supplierId 供应商ID
   * @param itemIds 可选的RFQ零件ID列表
   * @param token 认证令牌
   * @param organizationId 可选的组织ID
   * @returns 邮件模板
   */
  static async generateTemplate(projectId: string, supplierId: string, itemIds?: string[], token?: string, organizationId?: string) {
    try {
      if (!token) {
        console.error('No auth token provided for generateTemplate');
        return null;
      }
      
      // 构建API路径 - 修正路径格式
      const endpoint = `/projects/${projectId}/conversations/${supplierId}/generate-template`;
      console.log(`准备调用API: ${API_BASE_URL}${endpoint}`);
      
      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // 如果提供了组织ID，添加到请求头
      if (organizationId) {
        headers['X-Org-Id'] = organizationId;
      }
      
      // 修改：确保发送数组，避免发送 null
      const requestBody = { item_ids: itemIds && itemIds.length > 0 ? itemIds : [] };
      console.log(`发送请求体: ${JSON.stringify(requestBody)}`); 
      console.log(`使用认证令牌(截断): Bearer ${token.substring(0, 10)}...`);
      
      // 发送请求
      console.log("开始请求...");
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });
      
      console.log(`收到响应: 状态=${response.status}, 状态文本=${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`请求失败: ${errorText}`);
        
        let errorDetail = 'Failed to generate template';
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
      console.log("请求成功，收到数据");
      return data;
    } catch (error) {
      console.error('Error generating template:', error);
      throw error;
    }
  }
  
  /**
   * 发送邮件
   * 
   * @param conversationId 会话ID
   * @param emailData 邮件数据
   * @param token 认证令牌
   * @param organizationId 可选的组织ID
   * @returns 发送结果
   */
  static async sendEmail(conversationId: string, emailData: any, token?: string, organizationId?: string) {
    try {
      if (!token) {
        console.error('No auth token provided for sendEmail');
        return null;
      }
      
      // 构建API路径
      const endpoint = `/conversations/${conversationId}/send-email`;
      
      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // 如果提供了组织ID，添加到请求头
      if (organizationId) {
        headers['X-Org-Id'] = organizationId;
      }
      
      // 发送请求
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(emailData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send email');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
  
  /**
   * 获取项目会话列表
   * 
   * @param projectId 项目ID
   * @param page 页码
   * @param pageSize 每页数量
   * @param token 认证令牌
   * @param organizationId 可选的组织ID
   * @returns 会话列表
   */
  static async getProjectConversations(projectId: string, page = 1, pageSize = 10, token?: string, organizationId?: string) {
    try {
      if (!token) {
        console.error('No auth token provided for getProjectConversations');
        return null;
      }
      
      // 构建API路径
      const endpoint = `/projects/${projectId}/conversations?page=${page}&page_size=${pageSize}`;
      
      // 准备请求头
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      // 如果提供了组织ID，添加到请求头
      if (organizationId) {
        headers['X-Org-Id'] = organizationId;
      }
      
      // 发送请求
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get conversations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting project conversations:', error);
      throw error;
    }
  }
  
  /**
   * 获取会话邮件列表
   * 
   * @param conversationId 会话ID
   * @param token 认证令牌
   * @param organizationId 可选的组织ID
   * @returns 邮件列表
   */
  static async getConversationEmails(conversationId: string, token?: string, organizationId?: string) {
    try {
      if (!token) {
        console.error('No auth token provided for getConversationEmails');
        return null;
      }
      
      // 构建API路径
      const endpoint = `/conversations/${conversationId}/emails`;
      
      // 准备请求头
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      // 如果提供了组织ID，添加到请求头
      if (organizationId) {
        headers['X-Org-Id'] = organizationId;
      }
      
      // 发送请求
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get emails');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting conversation emails:', error);
      throw error;
    }
  }
  
  /**
   * 获取会话RFQ状态
   * 
   * @param conversationId 会话ID
   * @param token 认证令牌
   * @param organizationId 可选的组织ID
   * @returns RFQ状态
   */
  static async getConversationRfqStatus(conversationId: string, token?: string, organizationId?: string) {
    try {
      if (!token) {
        console.error('No auth token provided for getConversationRfqStatus');
        return null;
      }
      
      // 构建API路径
      const endpoint = `/conversations/${conversationId}/rfq-status`;
      
      // 准备请求头
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      // 如果提供了组织ID，添加到请求头
      if (organizationId) {
        headers['X-Org-Id'] = organizationId;
      }
      
      // 发送请求
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get RFQ status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting conversation RFQ status:', error);
      throw error;
    }
  }
} 