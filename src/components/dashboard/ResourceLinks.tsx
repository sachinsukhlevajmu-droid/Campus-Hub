import { ExternalLink, BookOpen, Video, FileText, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const resources = [
  {
    name: 'Khan Academy',
    url: 'https://www.khanacademy.org',
    icon: Video,
    color: 'bg-green-500',
    description: 'Free courses on math, science & more',
  },
  {
    name: 'Coursera',
    url: 'https://www.coursera.org',
    icon: BookOpen,
    color: 'bg-blue-500',
    description: 'Online courses from top universities',
  },
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com',
    icon: FileText,
    color: 'bg-red-500',
    description: 'Search academic papers & articles',
  },
  {
    name: 'Wolfram Alpha',
    url: 'https://www.wolframalpha.com',
    icon: Globe,
    color: 'bg-orange-500',
    description: 'Computational knowledge engine',
  },
];

export const ResourceLinks = () => {
  return (
    <Card className="gradient-card border shadow-soft hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className="font-display flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
          Quick Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {resources.map((resource) => (
          <a
            key={resource.name}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background transition-all group"
          >
            <div className={`w-8 h-8 rounded-lg ${resource.color} flex items-center justify-center shrink-0`}>
              <resource.icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium group-hover:text-primary transition-colors">
                {resource.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {resource.description}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
};
