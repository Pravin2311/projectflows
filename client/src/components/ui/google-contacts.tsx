import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Mail, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GoogleContact {
  resourceName: string;
  displayName: string;
  emailAddress: string;
  phoneNumber?: string;
  photoUrl?: string;
  organization?: string;
}

interface GoogleContactsProps {
  onContactSelect?: (contact: GoogleContact) => void;
  showSearch?: boolean;
  maxResults?: number;
}

export function GoogleContacts({ onContactSelect, showSearch = true, maxResults = 20 }: GoogleContactsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contacts = [], isLoading, error } = useQuery<GoogleContact[]>({
    queryKey: ['/api/google/contacts', searchQuery, maxResults],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', maxResults.toString());
      
      const response = await fetch(`/api/google/contacts?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
    enabled: true
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load contacts. Please check your Google authentication.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Google Contacts
        </CardTitle>
        
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contacts by name, email, or organization..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-contacts"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No contacts found matching your search.' : 'No contacts available.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {contacts.map((contact) => (
              <div
                key={contact.resourceName}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  onContactSelect 
                    ? 'hover:bg-gray-50 cursor-pointer border-gray-200' 
                    : 'border-gray-100'
                }`}
                onClick={() => onContactSelect?.(contact)}
                data-testid={`contact-${contact.resourceName}`}
              >
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {contact.photoUrl ? (
                    <img src={contact.photoUrl} alt={contact.displayName} className="h-10 w-10 rounded-full" />
                  ) : (
                    <span className="text-sm font-medium text-blue-600">
                      {contact.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.displayName}
                    </p>
                    {contact.organization && (
                      <Badge variant="secondary" className="text-xs">
                        <Building className="h-3 w-3 mr-1" />
                        {contact.organization}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 mt-1">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500 truncate">
                      {contact.emailAddress}
                    </p>
                  </div>
                  
                  {contact.phoneNumber && (
                    <p className="text-xs text-gray-400 mt-1">
                      {contact.phoneNumber}
                    </p>
                  )}
                </div>
                
                {onContactSelect && (
                  <Button variant="ghost" size="sm">
                    Select
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}