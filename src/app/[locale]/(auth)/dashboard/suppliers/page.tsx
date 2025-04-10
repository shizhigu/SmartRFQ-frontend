'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Mail, Phone, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { useApiWithOrganization, API_BASE_URL, createRequestOptions } from '@/utils/api';

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[] | null;
  created_at: string;
}

export default function SuppliersPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const { organizationId } = useApiWithOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  
  // Supplier form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    id: '',
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    tags: ''
  });
  
  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  useEffect(() => {
    syncUserAndFetchData();
  }, [organizationId]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSuppliers(suppliers);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      setFilteredSuppliers(
        suppliers.filter(supplier => 
          supplier.name.toLowerCase().includes(lowercasedSearch) ||
          (supplier.contact_name && supplier.contact_name.toLowerCase().includes(lowercasedSearch)) ||
          (supplier.email && supplier.email.toLowerCase().includes(lowercasedSearch)) ||
          (supplier.phone && supplier.phone.toLowerCase().includes(lowercasedSearch))
        )
      );
    }
  }, [searchTerm, suppliers]);

  // Get authentication token
  const getAuthToken = async () => {
    try {
      // Try to get the most appropriate token
      let token: string | null = null;
      
      try {
        // Try to get default token
        token = await getToken();
        if (token) return token;
      } catch (e) {
        console.log('Failed to get default token:', e);
      }
      
      try {
        // Try to get session token
        token = await getToken({ template: 'session' });
        if (token) return token;
      } catch (e) {
        console.log('Failed to get session token:', e);
      }
      
      if (!token) {
        throw new Error('Unable to get authentication token, please login first');
      }
      
      return token;
    } catch (error) {
      console.error('Failed to get authentication token:', error);
      throw error;
    }
  };

  // 同步用户到系统
  const syncUser = async () => {
    try {
      const token = await getAuthToken();
      
      // 发送同步请求
      const response = await fetch(`${API_BASE_URL}/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `User sync failed (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          if (errorText) errorMessage = errorText;
        }
        
        console.error('User sync failed:', errorMessage);
        
        // For 500 errors, we can still try to proceed with data fetching
        // as the user might already be in the system
        if (response.status === 500) {
          console.warn('Server error during sync, but will try to proceed with data fetching');
          return null; // Return null but don't throw error
        }
        
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      console.log('User sync successful:', userData);
      return userData;
    } catch (error) {
      console.error('User sync error:', error);
      throw error;
    }
  };

  // 同步用户并获取数据
  const syncUserAndFetchData = async () => {
    try {
      // 首先尝试同步用户
      try {
        await syncUser();
      } catch (error) {
        console.error('User sync failed, will try to fetch data anyway:', error);
        // We'll still try to fetch suppliers even if sync failed
      }
      
      // 然后获取供应商数据
      await fetchSuppliers();
    } catch (error) {
      console.error('Failed to initialize data:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to sync user or fetch suppliers. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      
      const options = createRequestOptions('GET', token, null, organizationId);
      
      const response = await fetch(`${API_BASE_URL}/suppliers`, options);
      
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      
      const data: Supplier[] = await response.json();
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load suppliers',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = await getAuthToken();
      
      // Process tags, convert from comma separated string to array
      const tagsArray = supplierForm.tags ? 
        supplierForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag) :
        null;
      
      const options = createRequestOptions(
        'POST', 
        token, 
        {
          name: supplierForm.name,
          contact_name: supplierForm.contact_name || null,
          email: supplierForm.email || null,
          phone: supplierForm.phone || null,
          address: supplierForm.address || null,
          tags: tagsArray
        },
        organizationId
      );
      
      const response = await fetch(`${API_BASE_URL}/suppliers`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create supplier');
      }
      
      await fetchSuppliers();
      setIsCreateDialogOpen(false);
      resetForm();
      
      toast({
        title: "Success",
        description: "Supplier created successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create supplier',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = await getAuthToken();
      
      // Process tags, convert from comma separated string to array
      const tagsArray = supplierForm.tags ? 
        supplierForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag) :
        null;
      
      const options = createRequestOptions(
        'PUT', 
        token, 
        {
          name: supplierForm.name,
          contact_name: supplierForm.contact_name || null,
          email: supplierForm.email || null,
          phone: supplierForm.phone || null,
          address: supplierForm.address || null,
          tags: tagsArray
        },
        organizationId
      );
      
      const response = await fetch(`${API_BASE_URL}/suppliers/${supplierForm.id}`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update supplier');
      }
      
      await fetchSuppliers();
      setIsEditDialogOpen(false);
      resetForm();
      
      toast({
        title: "Success",
        description: "Supplier updated successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update supplier',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      
      const options = createRequestOptions('DELETE', token, null, organizationId);
      
      const response = await fetch(`${API_BASE_URL}/suppliers/${supplierToDelete.id}`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete supplier');
      }
      
      await fetchSuppliers();
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
      
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete supplier',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editSupplier = (supplier: Supplier) => {
    setSupplierForm({
      id: supplier.id,
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      tags: supplier.tags?.join(', ') || ''
    });
    setIsEditDialogOpen(true);
  };

  const confirmDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setSupplierForm({
      id: '',
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      tags: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSupplierForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto py-6">
      <Toaster />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <Button onClick={() => {
          resetForm();
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Supplier
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
          <CardDescription>
            Manage your suppliers and their contact information
          </CardDescription>
          <div className="flex items-center mt-4">
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSuppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact_name || '–'}</TableCell>
                    <TableCell>
                      {supplier.email ? (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{supplier.email}</span>
                        </div>
                      ) : '–'}
                    </TableCell>
                    <TableCell>
                      {supplier.phone ? (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{supplier.phone}</span>
                        </div>
                      ) : '–'}
                    </TableCell>
                    <TableCell>
                      {supplier.tags && supplier.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {supplier.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : '–'}
                    </TableCell>
                    <TableCell>{format(new Date(supplier.created_at), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => editSupplier(supplier)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDeleteSupplier(supplier)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers found. Create your first supplier!'}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create Supplier Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Create a new supplier for your organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSupplier}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Supplier name"
                  value={supplierForm.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_name">Contact Person</Label>
                <Input
                  id="contact_name"
                  name="contact_name"
                  placeholder="Contact person name"
                  value={supplierForm.contact_name}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contact@supplier.com"
                  value={supplierForm.email}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+1 234 567 8900"
                  value={supplierForm.phone}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Supplier address"
                  value={supplierForm.address}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="electronics, manufacturing, etc."
                  value={supplierForm.tags}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Supplier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update the supplier information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSupplier}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="Supplier name"
                  value={supplierForm.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contact_name">Contact Person</Label>
                <Input
                  id="edit-contact_name"
                  name="contact_name"
                  placeholder="Contact person name"
                  value={supplierForm.contact_name}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  placeholder="contact@supplier.com"
                  value={supplierForm.email}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  placeholder="+1 234 567 8900"
                  value={supplierForm.phone}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  name="address"
                  placeholder="Supplier address"
                  value={supplierForm.address}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                <Input
                  id="edit-tags"
                  name="tags"
                  placeholder="electronics, manufacturing, etc."
                  value={supplierForm.tags}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Supplier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the supplier "{supplierToDelete?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 