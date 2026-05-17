import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LeadershipSectionPlaceholder({ title, description }) {
  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            For this release, use <strong>Leadership Overview</strong> — open the department pills there for
            drill-down. Dedicated pages here ship next.
          </p>
          <Button asChild variant="default">
            <Link to="/dashboard/leadership" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Leadership Overview
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
