"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  MapPin, Loader2, Leaf, 
  Wind, Droplets, Trash2, Volume2, AlertCircle, Eye, Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createReport, subscribeToReports, Report } from '@/lib/db/reports';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import { ReportFormImagesSection } from '@/components/reports/ReportFormImagesSection';
import { ReportCardImageGallery } from '@/components/reports/ReportCardImageGallery';
import { ReportDetailModal } from '@/components/reports/ReportDetailModal';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  issueType: z.string({ required_error: "Please select an issue type" }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(3, "Please provide a valid location"),
});

export default function ReportPage() {
  return <ReportPageContent />;
}

function ReportPageContent() {
  const { user, profile, communityId } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in-progress' | 'completed' | 'resolved' | 'unresolved'>('all');
  const [reports, setReports] = useState<Report[]>([]);
  
  // Selected report for full detail modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToReports(communityId || null, (data) => {
      setReports(data);
    }, selectedFilter);

    return () => unsubscribe();
  }, [selectedFilter, communityId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      issueType: "",
    },
  });

  // Pre-fill reporter name if user is signed in
  useEffect(() => {
    if (user && (profile?.name || user.displayName)) {
      form.setValue('name', profile?.name || user.displayName || '');
    }
  }, [user, profile, form]);

  const handleNewReportClick = () => {
    // No sign-in required! Open report modal directly for everyone
    setIsModalOpen(true);
  };

  const handleOpenReportDetails = (report: Report, imageIndex = 0) => {
    setSelectedReport(report);
    setInitialImageIndex(imageIndex);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const reportCommunityId = communityId || "public";
      const reportUserId = user?.uid || auth?.currentUser?.uid || "anonymous";

      await createReport({
        communityId: reportCommunityId,
        userId: reportUserId,
        name: values.name,
        issueType: values.issueType,
        description: values.description,
        location: values.location,
        images: images,
        image: images.length > 0 ? images[0] : null,
        status: 'unresolved',
      });

      toast({
        title: 'Incident Reported',
        description: 'Your report has been submitted successfully. Thank you for your contribution!',
      });
      
      form.reset({
        name: user ? (profile?.name || user.displayName || '') : '',
        location: '',
        description: '',
        issueType: '',
      });
      setImages([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error saving your report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusClass = (status: string) => {
    if (status === 'completed' || status === 'resolved') return 'bg-emerald-500/30 text-emerald-200';
    if (status === 'in-progress') return 'bg-blue-500/30 text-blue-100';
    return 'bg-orange-500/30 text-orange-100';
  };

  return (
    <div className="pt-24 pb-24 px-4 md:px-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline">Reports Dashboard</h1>
          <p className="text-muted-foreground">Review and submit environmental reports from your community or as a guest.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Reports" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleNewReportClick} variant="default" className="rounded-full px-5 py-2 neon-glow font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> New Report
          </Button>
        </div>
      </div>

      {/* Guest Information Banner */}
      {!user && (
        <div className="mb-6 glass p-4 rounded-2xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Open Public Reporting</p>
              <p className="text-xs text-muted-foreground">Anyone can explore and submit environmental reports without signing in. Sign in anytime to link reports to your account and track community points.</p>
            </div>
          </div>
          <Link href="/login?redirect=/report" className="shrink-0">
            <Button size="sm" variant="outline" className="rounded-xl border-primary/30 hover:bg-primary/10">
              Sign In (Optional)
            </Button>
          </Link>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {reports.length === 0 ? (
          <div className="glass p-6 rounded-3xl border border-white/10 text-center col-span-full py-12">
            <p className="text-muted-foreground">No reports found for this filter.</p>
            <Button onClick={handleNewReportClick} variant="outline" size="sm" className="mt-4 rounded-xl border-white/10">
              <Plus className="w-4 h-4 mr-1.5" /> Submit First Report
            </Button>
          </div>
        ) : (
          reports.map((report) => (
            <article 
              key={report.id} 
              className="glass p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 
                  className="text-lg font-semibold truncate pr-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleOpenReportDetails(report)}
                >
                  {report.name}
                </h3>
                <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap', statusClass(report.status))}>
                  {report.status}
                </span>
              </div>
              <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">#{report.issueType}</div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{report.description}</p>
              
              <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0 text-primary" />
                <span className="truncate">{report.location || 'Unknown Location'}</span>
              </div>

              {/* Image Section in Report Card with Carousel & Indicators */}
              <ReportCardImageGallery
                images={report.images}
                fallbackImage={report.image}
                reportName={report.name}
                onImageClick={(index) => handleOpenReportDetails(report, index)}
              />
              
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                <span>{report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                <button
                  type="button"
                  onClick={() => handleOpenReportDetails(report)}
                  className="text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Eye className="w-3 h-3" /> View Details
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* New Report Modal - No sign in required */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" 
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-card w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 animate-in zoom-in-90 max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold font-headline">Report an Environmental Issue</h2>
                <p className="text-xs text-muted-foreground">
                  {user 
                    ? `Reporting as registered user (${user.displayName || user.email})` 
                    : 'Reporting as guest (no sign in required)'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full hover:bg-white/10">
                ✕
              </Button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name / Submitter</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Jane Doe or Anonymous Resident" className="bg-white/5 border-white/10 rounded-xl py-3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issueType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl py-3">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass">
                            <SelectItem value="air">Air Pollution</SelectItem>
                            <SelectItem value="water">Water Quality</SelectItem>
                            <SelectItem value="garbage">Garbage / Waste</SelectItem>
                            <SelectItem value="noise">Noise Pollution</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address, coordinates, or landmark" className="bg-white/5 border-white/10 rounded-xl py-3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the incident in detail (what you observed, time, severity)..." className="bg-white/5 border-white/10 rounded-xl min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Evidence & Camera Image Section */}
                <ReportFormImagesSection
                  images={images}
                  onChange={setImages}
                  maxImages={6}
                />

                <Button type="submit" className="w-full rounded-xl py-3 neon-glow font-bold text-base" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting Report...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Actual Report Detail Modal with dedicated Image Section */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        initialImageIndex={initialImageIndex}
      />
    </div>
  );
}
