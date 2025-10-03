'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Download, FileText, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PermitOffice {
  id?: string;
  city: string;
  county: string;
  state: string;
  jurisdiction_type: string;
  department_name: string;
  office_type: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours_monday?: string | null;
  hours_tuesday?: string | null;
  hours_wednesday?: string | null;
  hours_thursday?: string | null;
  hours_friday?: string | null;
  hours_saturday?: string | null;
  hours_sunday?: string | null;
  building_permits?: boolean;
  electrical_permits?: boolean;
  plumbing_permits?: boolean;
  mechanical_permits?: boolean;
  zoning_permits?: boolean;
  planning_review?: boolean;
  inspections?: boolean;
  online_applications?: boolean;
  online_payments?: boolean;
  permit_tracking?: boolean;
  online_portal_url?: string | null;
  permitFees?: {
    building?: { amount?: number; description?: string; unit?: string };
    electrical?: { amount?: number; description?: string; unit?: string };
    plumbing?: { amount?: number; description?: string; unit?: string };
    mechanical?: { amount?: number; description?: string; unit?: string };
    zoning?: { amount?: number; description?: string; unit?: string };
    general?: { amount?: number; description?: string; unit?: string };
  } | null;
  instructions?: {
    general?: string;
    building?: string;
    electrical?: string;
    plumbing?: string;
    mechanical?: string;
    zoning?: string;
  } | null;
}

interface ExportButtonProps {
  searchResults: PermitOffice[];
  searchQuery?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export default function ExportButton({
  searchResults,
  searchQuery,
  className = '',
  size = 'default'
}: ExportButtonProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const [isExporting, setIsExporting] = useState(false);
  const [, setExportFormat] = useState<string>('');

  // Don't show button if user is not loaded or not authenticated
  if (!isLoaded || !user) {
    return null;
  }

  // Check if user has Enterprise plan
  const userPlan = user?.subscriptionPlan as string | undefined;
  const hasAccess = userPlan === 'enterprise';

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!hasAccess) {
      // Redirect to pricing page for non-Enterprise users
      window.location.href = '/pricing';
      return;
    }

    if (searchResults.length === 0) {
      alert('No search results to export');
      return;
    }

    setIsExporting(true);
    setExportFormat(format);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          searchResults,
          searchQuery,
        }),
      });

      if (response.ok) {
        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `permit-offices-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (response.status === 403) {
        // User doesn't have Enterprise plan
        window.location.href = '/pricing';
      } else {
        const errorData = await response.json();
        console.error('Export failed:', errorData.error);
        alert('Failed to export search results. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export search results. Please try again.');
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  // Show upgrade prompt for non-Enterprise users
  if (!hasAccess) {
    return (
      <Button
        onClick={() => window.location.href = '/pricing'}
        variant="outline"
        size={size}
        className={`${className} border-purple-200 text-purple-600 hover:bg-purple-50`}
      >
        <Download className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
        Export (Enterprise)
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={isExporting || searchResults.length === 0}
          className={className}
        >
          {isExporting ? (
            <>
              <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-2 animate-spin`} />
              Exporting...
            </>
          ) : (
            <>
              <Download className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
              Export Results
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <File className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
