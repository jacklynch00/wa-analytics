'use client';

import { useState } from 'react';
import { Resource } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ExternalLink, Calendar, User, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { linkifyText } from '@/lib/linkify';

interface ResourceHubProps {
  resources: Resource[];
}

export default function ResourceHub({ resources }: ResourceHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'link' | 'tool' | 'document'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'domain'>('date');

  const categoryColors = {
    link: 'bg-blue-100 text-blue-800',
    tool: 'bg-green-100 text-green-800',
    document: 'bg-purple-100 text-purple-800',
  };

  const filteredResources = resources
    .filter(resource => {
      const matchesSearch = resource.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.sharedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.dateShared.getTime() - a.dateShared.getTime();
      } else {
        return a.domain.localeCompare(b.domain);
      }
    });

  const categoryStats = {
    all: resources.length,
    link: resources.filter(r => r.category === 'link').length,
    tool: resources.filter(r => r.category === 'tool').length,
    document: resources.filter(r => r.category === 'document').length,
  };

  return (
    <div className="space-y-6">
      {/* Resource Summary at the top */}
      {resources.length > 0 && (
        <Card className="bg-[var(--card-hover-bg)]">
          <CardHeader>
            <CardTitle className="card-title">Resource Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="card-value">{resources.length}</div>
                <div className="card-title">Total Resources</div>
              </div>
              <div>
                <div className="card-value text-[var(--brand)]">{categoryStats.link}</div>
                <div className="card-title">Links</div>
              </div>
              <div>
                <div className="card-value text-[var(--accent)]">{categoryStats.tool}</div>
                <div className="card-title">Tools</div>
              </div>
              <div>
                <div className="card-value text-[var(--chart-nutrition)]">{categoryStats.document}</div>
                <div className="card-title">Documents</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-secondary)]" />
          <Input
            placeholder="Search resources, domains, or contributors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'domain')}
            className="px-3 py-2 border border-[var(--border)] rounded-[var(--radius-medium)] focus:outline-[var(--focus-outline)] focus:outline-offset-[var(--focus-offset)] text-[var(--text-primary)] bg-[var(--card-bg)]"
          >
            <option value="date">Sort by Date</option>
            <option value="domain">Sort by Domain</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryStats).map(([category, count]) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category as any)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredResources.map((resource, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between space-x-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={categoryColors[resource.category]}>
                      {resource.category}
                    </Badge>
                    <span className="text-sm text-gray-500">{resource.domain}</span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2">
                    <a 
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline transition-colors"
                    >
                      {resource.title || resource.url}
                    </a>
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {linkifyText(resource.context)}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>Shared by {resource.sharedBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(resource.dateShared, 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(resource.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'No resources found matching your criteria'
                : 'No resources found in this chat'
              }
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}