import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, FileText, Plus, ExternalLink, Calendar, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GoogleDocument {
  documentId: string;
  title: string;
  createTime: string;
  updateTime: string;
  webViewLink: string;
  thumbnailLink?: string;
}

interface GoogleDocsProps {
  onDocumentSelect?: (document: GoogleDocument) => void;
  showSearch?: boolean;
  showCreateButton?: boolean;
  maxResults?: number;
}

export function GoogleDocs({ 
  onDocumentSelect, 
  showSearch = true, 
  showCreateButton = true,
  maxResults = 20 
}: GoogleDocsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    content: ""
  });
  
  const { toast } = useToast();

  const { data: documents = [], isLoading, error, refetch } = useQuery<GoogleDocument[]>({
    queryKey: ['/api/google/docs', searchQuery, maxResults],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', maxResults.toString());
      
      const response = await fetch(`/api/google/docs?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    enabled: true
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; content?: string }) => {
      return apiRequest('POST', '/api/google/docs', data);
    },
    onSuccess: () => {
      toast({
        title: "Document Created",
        description: "Your Google Doc has been created successfully.",
      });
      setIsCreateOpen(false);
      setCreateForm({ title: "", content: "" });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: "Failed to create document. Please try again.",
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
        description: "Please enter a document title.",
        variant: "destructive",
      });
      return;
    }
    
    createDocumentMutation.mutate({
      title: createForm.title,
      content: createForm.content || undefined
    });
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
            Failed to load documents. Please check your Google authentication and ensure Docs API is enabled.
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
            <FileText className="h-5 w-5" />
            Google Docs
          </CardTitle>
          
          {showCreateButton && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-create-doc">
                  <Plus className="h-4 w-4 mr-2" />
                  New Doc
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc-title">Document Title</Label>
                    <Input
                      id="doc-title"
                      data-testid="input-doc-title"
                      placeholder="Enter document title..."
                      value={createForm.title}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="doc-content">Initial Content (Optional)</Label>
                    <Textarea
                      id="doc-content"
                      data-testid="textarea-doc-content"
                      placeholder="Enter initial content..."
                      value={createForm.content}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                    />
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
                      disabled={createDocumentMutation.isPending}
                      data-testid="button-create-doc-submit"
                    >
                      {createDocumentMutation.isPending ? "Creating..." : "Create Document"}
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
              placeholder="Search documents by title..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-docs"
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
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No documents found</p>
            <p className="text-sm">
              {searchQuery ? "Try adjusting your search" : "Create your first document to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.documentId}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => onDocumentSelect?.(doc)}
                data-testid={`doc-item-${doc.documentId}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {doc.thumbnailLink ? (
                        <img 
                          src={doc.thumbnailLink} 
                          alt=""
                          className="w-8 h-8 rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.title}
                      </h3>
                      
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          Modified {formatDate(doc.updateTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(doc.webViewLink, '_blank');
                    }}
                    data-testid={`button-open-doc-${doc.documentId}`}
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