'use client';

import { OrganizationSwitcher, UserButton, useAuth, useOrganization } from '@clerk/nextjs';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useState } from 'react';

import { ActiveLink } from '@/components/ActiveLink';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ToggleMenuButton } from '@/components/ToggleMenuButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, Settings, User, Search, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/templates/Logo';
import { getI18nPath } from '@/utils/Helpers';
import { ProjectSelector } from '@/components/ProjectSelector';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const DashboardHeader = (props: {
  menu: {
    href: string;
    label: string;
  }[];
}) => {
  const locale = useLocale();
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 检查菜单项是否处于活动状态的函数
  const isActiveMenu = (href: string) => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith(href);
    }
    return false;
  };

  const handleSyncUser = async () => {
    setIsSyncing(true);
    try {
      // 尝试获取认证令牌
      let token: string | null = null;
      let tokenType = "未知";
      
      // 首先尝试获取默认令牌
      try {
        const defaultToken = await getToken();
        if (defaultToken) {
          token = defaultToken;
          tokenType = "默认";
          console.log(`成功获取默认令牌`);
        }
      } catch (error) {
        console.log(`获取默认令牌失败:`, error);
      }
      
      // 如果默认令牌获取失败，尝试session令牌
      if (!token) {
        try {
          const sessionToken = await getToken({ template: 'session' as any });
          if (sessionToken) {
            token = sessionToken;
            tokenType = "session";
            console.log(`成功获取session令牌`);
          }
        } catch (error) {
          console.log(`获取session令牌失败:`, error);
        }
      }
      
      // 如果所有尝试都失败
      if (!token) {
        throw new Error('未能获取认证令牌，请先登录');
      }
      
      console.log(`使用${tokenType}令牌：`, token.substring(0, 25) + '...');
      
      // 尝试解析JWT令牌内容，用于调试
      try {
        if (token.split('.').length === 3) {
          const parts = token.split('.');
          const padding = '='.repeat((4 - (parts[1]?.length ?? 0) % 4) % 4);
          const payload = window.atob((parts[1] ?? '') + padding);
          console.log('Token content:', JSON.parse(payload));
        }
      } catch (e) {
        console.log('Token parsing failed:', e);
      }
      
      // 发送同步请求
      const API_BASE_URL = 'http://localhost:8003/api';
      const response = await fetch(`${API_BASE_URL}/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      console.log('响应状态:', response.status);
      console.log('响应头:', [...response.headers.entries()]);

      if (response.status === 401) {
        throw new Error('认证失败：无效的认证凭据');
      } else if (response.status === 403) {
        throw new Error('认证失败：没有足够的权限');
      } else if (!response.ok) {
        const errorText = await response.text();
        console.error('错误响应:', errorText);
        
        let errorMessage = `请求失败 (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      console.log('同步成功，用户数据:', userData);
      
      toast({
        title: "同步成功",
        description: "用户信息已成功同步",
        variant: "default",
      });
    } catch (error) {
      console.error('同步用户失败:', error);
      toast({
        title: "同步失败",
        description: error instanceof Error ? error.message : '同步用户信息失败',
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const checkToken = async () => {
    try {
      // 检查可用的令牌类型
      const results: Record<string, string> = {};
      let token: string | null = null;
      
      try {
        // 尝试获取默认令牌
        const t = await getToken();
        results['默认'] = t ? `${t.substring(0, 15)}...` : '未获取到';
        if (!token && t) token = t;
      } catch (e: any) {
        results['默认'] = `错误: ${e.message || '未知错误'}`;
      }
      
      try {
        // 尝试获取session令牌
        const t = await getToken({ template: 'session' });
        results['session'] = t ? `${t.substring(0, 15)}...` : '未获取到';
        if (!token && t) token = t;
      } catch (e: any) {
        results['session'] = `错误: ${e.message || '未知错误'}`;
      }
      
      console.log('令牌测试结果:', results);
      
      if (!token) {
        toast({
          title: "认证问题",
          description: "未能获取任何类型的认证令牌，请确保已登录",
          variant: "destructive",
        });
      } else {
        toast({
          title: "令牌获取成功",
          description: "请查看控制台了解详情",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('获取令牌失败:', error);
      toast({
        title: "令牌获取失败",
        description: error instanceof Error ? error.message : '未知错误',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between w-full h-16 px-4 border-b bg-background sticky top-0 z-50">
      <div className="flex items-center">
        {/* Logo */}
        <Link href="/dashboard" className="mr-8 flex items-center">
          <span className="text-lg font-bold text-primary">Xinra</span>
        </Link>

        {/* 主导航 */}
        <nav className="hidden md:flex items-center space-x-2">
          {props.menu.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActiveMenu(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* 组织选择器 */}
        <OrganizationSwitcher
          organizationProfileMode="navigation"
          organizationProfileUrl={getI18nPath(
            '/dashboard/organization-profile',
            locale,
          )}
          afterCreateOrganizationUrl="/dashboard"
          hidePersonal
          skipInvitationScreen
          appearance={{
            elements: {
              organizationSwitcherTrigger: 'h-9 rounded-md border bg-background px-3 text-sm',
              rootBox: 'max-w-40 sm:max-w-64',
            },
          }}
        />

        {/* 项目选择器 */}
        <div className="hidden sm:flex">
          <ProjectSelector />
        </div>

        {/* 通知铃铛 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h2 className="font-semibold">通知</h2>
              <Button variant="ghost" size="sm">
                全部标为已读
              </Button>
            </div>
            <div className="py-2 max-h-[300px] overflow-auto">
              <div className="px-4 py-2 hover:bg-muted cursor-pointer">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">新的询价回复</p>
                    <p className="text-xs text-muted-foreground">供应商XYZ已回复您的询价</p>
                    <p className="text-xs text-muted-foreground mt-1">10分钟前</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 hover:bg-muted cursor-pointer">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 h-8 w-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">文档解析完成</p>
                    <p className="text-xs text-muted-foreground">您上传的文档已成功解析</p>
                    <p className="text-xs text-muted-foreground mt-1">1小时前</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 hover:bg-muted cursor-pointer">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 h-8 w-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">系统更新</p>
                    <p className="text-xs text-muted-foreground">系统已更新至最新版本</p>
                    <p className="text-xs text-muted-foreground mt-1">1天前</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 border-t">
              <Button variant="outline" size="sm" className="w-full">
                查看所有通知
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 用户按钮 */}
        <UserButton
          userProfileMode="navigation"
          userProfileUrl="/dashboard/user-profile"
          appearance={{
            elements: {
              userButtonBox: 'h-9',
              userButtonTrigger: 'h-9 w-9',
            },
          }}
        />

        {/* 移动端菜单 */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToggleMenuButton />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {props.menu.map(item => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
