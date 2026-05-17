import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Send,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const EXAMPLE_PROMPTS = [
  'Summarize aggregation rice totals by hub for the last market day.',
  'Which checklists had the most pending submissions this week?',
  'Compare warehouse milling output across shifts.',
  'Show trends in flagged submissions for my department.',
];

const SAMPLE_EXCHANGE = [
  {
    role: 'user',
    text: 'What was total rice received at Dwangwa hub last session?',
  },
  {
    role: 'assistant',
    text:
      'Preview only — in a future release, the assistant will query live submissions and sessions to answer questions like this with charts and tables.',
  },
];

export default function AiAnalyticsComingSoon({ audience = 'leadership' }) {
  const backHref =
    audience === 'manager' ? '/dashboard/manager' : '/dashboard/leadership';
  const backLabel = audience === 'manager' ? 'Manager dashboard' : 'Leadership overview';

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">AI Analytics Assistant</h1>
            <Badge variant="secondary" className="bg-amber-100 text-amber-900 hover:bg-amber-100">
              Coming soon
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions about operations data in plain language — planned for a future release.
          </p>
        </div>
      </div>

      <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            What this will do
          </CardTitle>
          <CardDescription>
            {audience === 'manager'
              ? 'Managers will be able to ask for summaries, trends, and comparisons across tasks and submissions for their department.'
              : 'Leadership will be able to ask for cross-department analytics, hub performance, and operational insights from checklist data.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            Natural-language questions instead of building every report by hand.
          </p>
          <p className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            Answers grounded in Firestore submissions, tasks, and aggregation sessions.
          </p>
        </CardContent>
      </Card>

      <Card className="opacity-95 pointer-events-none select-none" aria-hidden="true">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Preview — not interactive yet
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {SAMPLE_EXCHANGE.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <span
                key={prompt}
                className="text-xs rounded-full border bg-background px-3 py-1.5 text-muted-foreground"
              >
                {prompt}
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Input
              disabled
              placeholder="Ask about your operations data…"
              className="bg-muted/50"
            />
            <Button type="button" size="icon" disabled variant="secondary" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Part of the first-release roadmap. Use existing dashboards and reports until this ships.
      </p>

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link to={backHref} className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to {backLabel}
        </Link>
      </Button>
    </div>
  );
}
