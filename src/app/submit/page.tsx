"use client";

import { useState } from "react";
import { Upload, Link as LinkIcon, Image as ImageIcon, Type, FileText, Tag, CheckCircle2, AlertCircle } from "lucide-react";

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    shortDescription: "",
    fullDescription: "",
    category: "",
    tags: "",
    coverImageUrl: "",
    coverImage: null as File | null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, coverImage: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    
    if (
      !formData.title ||
      formData.shortDescription.trim().length < 10 ||
      !formData.category ||
      !formData.coverImageUrl.trim()
    ) {
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    try {
      const r = await fetch("/api/games/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          url: formData.url.trim() || undefined,
          shortDescription: formData.shortDescription.trim(),
          fullDescription: formData.fullDescription.trim() || undefined,
          categorySlug: formData.category,
          coverImage: formData.coverImageUrl.trim(),
          tags: formData.tags.trim() || undefined,
        }),
      });
      if (!r.ok) {
        setSubmitStatus("error");
        return;
      }
      setSubmitStatus("success");
      setFormData({
        title: "",
        url: "",
        shortDescription: "",
        fullDescription: "",
        category: "",
        tags: "",
        coverImageUrl: "",
        coverImage: null,
      });
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pb-12">
      
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Submit a Game</h1>
        <p className="text-text-secondary text-lg">
          Share your AI game or character with the HeyWaii community. All submissions are reviewed by our team before publishing.
        </p>
      </div>

      <div className="bg-background-paper rounded-3xl border border-white/5 p-6 md:p-10 shadow-2xl">
        
        {/* Status Messages */}
        {submitStatus === "success" && (
          <div className="mb-8 p-4 rounded-xl bg-status-success/10 border border-status-success/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-6 h-6 text-status-success flex-shrink-0" />
            <div>
              <h3 className="text-status-success font-bold mb-1">Submission Successful!</h3>
              <p className="text-sm text-status-success/80">Your game has been submitted and is currently pending review. You can check its status in your profile.</p>
            </div>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="mb-8 p-4 rounded-xl bg-status-error/10 border border-status-error/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-6 h-6 text-status-error flex-shrink-0" />
            <div>
              <h3 className="text-status-error font-bold mb-1">Submission Failed</h3>
              <p className="text-sm text-status-error/80">Please check that all required fields are filled out correctly and try again.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Info Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-4">Basic Information</h2>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" /> Game Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Cyberpunk AI Adventure"
                  className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:ring-2 ring-primary/50 focus:border-primary transition-all outline-none"
                />
              </div>

              {/* URL */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> External URL (Optional)
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:ring-2 ring-primary/50 focus:border-primary transition-all outline-none"
                />
                <p className="text-xs text-text-muted mt-2">Provide a link if the game is hosted elsewhere.</p>
              </div>
            </div>
          </section>

          {/* Description Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-4">Details & Media</h2>
            
            <div className="space-y-4">
              {/* Short Description */}
              <div>
                <label htmlFor="shortDescription" className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Short Description *
                </label>
                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  required
                  rows={2}
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="A brief catchy summary of your game..."
                  maxLength={150}
                  className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:ring-2 ring-primary/50 focus:border-primary transition-all outline-none resize-none"
                />
                <div className="text-right text-xs text-text-muted mt-1">
                  {formData.shortDescription.length}/150
                </div>
              </div>

              {/* Full Description */}
              <div>
                <label htmlFor="fullDescription" className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Full Description
                </label>
                <textarea
                  id="fullDescription"
                  name="fullDescription"
                  rows={6}
                  value={formData.fullDescription}
                  onChange={handleChange}
                  placeholder="Detailed information about gameplay, features, story..."
                  className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:ring-2 ring-primary/50 focus:border-primary transition-all outline-none resize-y"
                />
              </div>

              <div>
                <label
                  htmlFor="coverImageUrl"
                  className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" /> Cover image URL *
                </label>
                <input
                  type="url"
                  id="coverImageUrl"
                  name="coverImageUrl"
                  required
                  value={formData.coverImageUrl}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:ring-2 ring-primary/50 focus:border-primary transition-all outline-none"
                />
                <p className="text-xs text-text-muted mt-2">
                  Use a public HTTPS image URL (e.g. Unsplash). File upload to storage is not wired yet.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Local preview (optional)
                </label>
                <div className="mt-2 flex justify-center rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors px-6 py-10 bg-background-elevated/50 group cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="text-center">
                    {formData.coverImage ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-status-success" />
                        <div className="text-sm font-medium text-status-success">
                          {formData.coverImage.name}
                        </div>
                        <p className="text-xs text-text-muted">For your reference only</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="mx-auto h-12 w-12 text-text-muted group-hover:text-primary transition-colors" />
                        <p className="text-sm text-text-secondary">Optional local file (not uploaded)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Classification Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-4">Classification</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Category *
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="appearance-none w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:ring-2 ring-primary/50 focus:border-primary transition-all outline-none"
                  >
                    <option value="" disabled>Select a category</option>
                    <option value="rpg">RPG</option>
                    <option value="simulation">Simulation</option>
                    <option value="puzzle">Puzzle</option>
                    <option value="action">Action</option>
                    <option value="visual-novel">Visual Novel</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Comma separated (e.g. sci-fi, romance)"
                  className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:ring-2 ring-primary/50 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>
          </section>

          {/* Submit Action */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-end gap-4">
            <button 
              type="button" 
              className="px-6 py-3 text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white rounded-xl bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Game"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}