import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Table, Plus, ExternalLink, Calendar, BarChart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GoogleSpreadsheet {
  spreadsheetId: string;
  title: string;
  createTime: string;
  updateTime: string;
  webViewLink: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    gridProperties: {
      rowCount: number;
      columnCount: number;
    };
  }>;
}

interface GoogleSheetsProps {
  onSpreadsheetSelect?: (spreadsheet: GoogleSpreadsheet) => void;
  showSearch?: boolean;
  showCreateButton?: boolean;
  maxResults?: number;
  projectId?: string;
}

export function GoogleSheets({ 
  onSpreadsheetSelect, 
  showSearch = true, 
  showCreateButton = true,
  maxResults = 20,
  projectId
}: GoogleSheetsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    type: "blank" as "blank" | "project-tracker"
  });
  
  const { toast } = useToast();

  const { data: spreadsheets = [], isLoading, error, refetch } = useQuery<GoogleSpreadsheet[]>({
    queryKey: ['/api/google/sheets', searchQuery, maxResults],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', maxResults.toString());
      
      const response = await fetch(`/api/google/sheets?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch spreadsheets');
      return response.json();
    },
    enabled: true
  });

  const createSpreadsheetMutation = useMutation({
    mutationFn: async (data: { title: string; type: string }) => {
      return apiRequest('POST', '/api/google/sheets', data);
    },
    onSuccess: () => {
      toast({
        title: "Spreadsheet Created",
        description: "Your Google Sheet has been created successfully.",
      });
      setIsCreateOpen(false);
      setCreateForm({ title: "", type: "blank" });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: "Failed to create spreadsheet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncTasksMutation = useMutation({
    mutationFn: async (spreadsheetId: string) => {
      return apiRequest('POST', `/api/projects/${projectId}/sync-to-sheets`, { spreadsheetId });
    },
    onSuccess: () => {
      toast({
        title: "Tasks Synced",
        description: "Project tasks have been synced to the spreadsheet.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync tasks to spreadsheet.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a spreadsheet title.",
        variant: "destructive",
      });
      return;
    }
    
    createSpreadsheetMutation.mutate(createForm);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load spreadsheets. Please check your Google authentication and ensure Sheets API is enabled.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Google Sheets
          </CardTitle>
          
          {showCreateButton && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-create-sheet">
                  <Plus className="h-4 w-4 mr-2" />
                  New Sheet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Spreadsheet</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sheet-title">Spreadsheet Title</Label>
                    <Input
                      id="sheet-title"
                      data-testid="input-sheet-title"
                      placeholder="Enter spreadsheet title..."
                      value={createForm.title}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Template Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={createForm.type === "blank" ? "default" : "outline"}
                        className="h-auto p-3 flex-col items-start"
                        onClick={() => setCreateForm(prev => ({ ...prev, type: "blank" }))}
                        data-testid="button-type-blank"
                      >
                        <Table className="h-6 w-6 mb-1" />
                        <span className="font-medium">Blank</span>
                        <span className="text-xs opacity-70">Empty spreadsheet</span>
                      </Button>
                      
                      <Button
                        type="button"
                        variant={createForm.type === "project-tracker" ? "default" : "outline"}
                        className="h-auto p-3 flex-col items-start"
                        onClick={() => setCreateForm(prev => ({ ...prev, type: "project-tracker" }))}
                        data-testid="button-type-tracker"
                      >
                        <BarChart className="h-6 w-6 mb-1" />
                        <span className="font-medium">Project Tracker</span>
                        <span className="text-xs opacity-70">Tasks, timeline, budget</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createSpreadsheetMutation.isPending}
                      data-testid="button-create-sheet-submit"
                    >
                      {createSpreadsheetMutation.isPending ? "Creating..." : "Create Spreadsheet"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search spreadsheets by title..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-sheets"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : spreadsheets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Table className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No spreadsheets found</p>
            <p className="text-sm">
              {searchQuery ? "Try adjusting your search" : "Create your first spreadsheet to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {spreadsheets.map((sheet) => (
              <div
                key={sheet.spreadsheetId}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => onSpreadsheetSelect?.(sheet)}
                data-testid={`sheet-item-${sheet.spreadsheetId}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <Table className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {sheet.title}
                      </h3>
                      
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          Modified {formatDate(sheet.updateTime)}
                        </div>
                        
                        <Badge variant="secondary" className="text-xs">
                          {sheet.sheets.length} sheet{sheet.sheets.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      {sheet.sheets.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {sheet.sheets.slice(0, 3).map(s => s.title).join(', ')}
                          {sheet.sheets.length > 3 && '...'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {projectId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        syncTasksMutation.mutate(sheet.spreadsheetId);
                      }}
                      disabled={syncTasksMutation.isPending}
                      data-testid={`button-sync-${sheet.spreadsheetId}`}
                    >
                      <BarChart className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(sheet.webViewLink, '_blank');
                    }}
                    data-testid={`button-open-sheet-${sheet.spreadsheetId}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}