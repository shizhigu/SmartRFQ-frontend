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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/templates/Logo';
import { getI18nPath } from '@/utils/Helpers';

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
          const padding = '='.repeat((4 - parts[1].length % 4) % 4);
          const payload = window.atob(parts[1] + padding);
          console.log('令牌内容:', JSON.parse(payload));
        }
      } catch (e) {
        console.log('令牌解析失败:', e);
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
    <>
      <div className="flex items-center">
        <Link href="/dashboard" className="max-sm:hidden">
          <Logo />
        </Link>

        <svg
          className="size-8 stroke-muted-foreground max-sm:hidden"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" />
          <path d="M17 5 7 19" />
        </svg>

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
              organizationSwitcherTrigger: 'max-w-28 sm:max-w-52 h-10 rounded-md border bg-background p-1 text-sm',
              rootBox: 'ml-3 max-w-40 sm:max-w-64',
            },
          }}
        />

        <nav className="ml-3 max-lg:hidden">
          <ul className="flex flex-row items-center gap-x-3 text-lg font-medium [&_a:hover]:opacity-100 [&_a]:opacity-75">
            {props.menu.map(item => (
              <li key={item.href}>
                <ActiveLink href={item.href}>{item.label}</ActiveLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div>
        <ul className="flex items-center gap-x-1.5 [&_li[data-fade]:hover]:opacity-100 [&_li[data-fade]]:opacity-60">
          {/* 显示当前组织 */}
          <li className="mr-2">
            {organization && (
              <span className="text-sm px-2 py-1 rounded bg-muted">
                {organization.name || "组织"}
              </span>
            )}
          </li>

          <li>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncUser}
              disabled={isSyncing}
              className="mr-1"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  同步中...
                </>
              ) : '同步用户'}
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={checkToken}
                title="调试认证令牌"
              >
                🔑
              </Button>
            )}
          </li>

          <li data-fade>
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ToggleMenuButton />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {props.menu.map(item => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>

          {/* PRO: Dark mode toggle button */}

          <li data-fade>
            <LocaleSwitcher />
          </li>

          <li>
            <Separator orientation="vertical" className="h-4" />
          </li>

          <li>
            <UserButton
              userProfileMode="navigation"
              userProfileUrl="/dashboard/user-profile"
              appearance={{
                elements: {
                  rootBox: 'px-2 py-1.5',
                },
              }}
            />
          </li>
        </ul>
      </div>
    </>
  );
};
