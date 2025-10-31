"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Camera, Upload, X, Check } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileFormData {
  displayName: string;
  bio: string;
  skills: string[];
  location: string;
  timezone: string;
  languages: string[];
  hourlyRate?: number;
}

const SKILLS_OPTIONS = [
  "Web Development", "Mobile Development", "Design", "Writing", "Marketing",
  "Photography", "Video Editing", "Music", "Teaching", "Consulting",
  "Translation", "Data Analysis", "Project Management", "Customer Service",
  "Sales", "Accounting", "Legal", "Healthcare", "Fitness", "Cooking",
  "Gardening", "Repair", "Cleaning", "Childcare", "Elderly Care"
];

const LANGUAGES_OPTIONS = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Russian"
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [introMedia, setIntroMedia] = useState<File | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProfileFormData>();

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill) && selectedSkills.length < 10) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const addLanguage = (language: string) => {
    if (!selectedLanguages.includes(language) && selectedLanguages.length < 5) {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const removeLanguage = (language: string) => {
    setSelectedLanguages(selectedLanguages.filter(l => l !== language));
  };

  const handleImageUpload = (file: File, type: 'profile' | 'intro') => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (type === 'profile') {
      setProfileImage(file);
    } else {
      setIntroMedia(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('displayName', data.displayName);
      formData.append('bio', data.bio);
      formData.append('location', data.location);
      formData.append('timezone', data.timezone);
      formData.append('skills', JSON.stringify(selectedSkills));
      formData.append('languages', JSON.stringify(selectedLanguages));
      if (data.hourlyRate) formData.append('hourlyRate', data.hourlyRate.toString());
      if (profileImage) formData.append('profileImage', profileImage);
      if (introMedia) formData.append('introMedia', introMedia);

      const response = await fetch('/api/profiles/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success("Profile completed successfully!");
        router.push('/dashboard');
      } else {
        throw new Error('Failed to complete profile');
      }
    } catch (error) {
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Complete Your Profile</h1>
            <p className="text-slate-300">Let others know who you are and what you can offer</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Step {currentStep} of 4</span>
              <span>{Math.round((currentStep / 4) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-2xl font-semibold text-white mb-6">Basic Information</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Display Name *
                    </label>
                    <input
                      {...register('displayName', { required: 'Display name is required' })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="How should others see you?"
                    />
                    {errors.displayName && (
                      <p className="text-red-400 text-sm mt-1">{errors.displayName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bio *
                    </label>
                    <textarea
                      {...register('bio', { required: 'Bio is required' })}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Tell others about yourself, your experience, and what you can offer..."
                    />
                    {errors.bio && (
                      <p className="text-red-400 text-sm mt-1">{errors.bio.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Location
                    </label>
                    <input
                      {...register('location')}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Skills */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-2xl font-semibold text-white mb-6">Your Skills</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Select your skills (up to 10) *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-600 text-white"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SKILLS_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      disabled={selectedSkills.includes(skill) || selectedSkills.length >= 10}
                      className="p-2 text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-colors"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Media */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-2xl font-semibold text-white mb-6">Profile Media</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
                        {profileImage ? (
                          <img
                            src={URL.createObjectURL(profileImage)}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'profile')}
                          className="hidden"
                          id="profile-image"
                        />
                        <label
                          htmlFor="profile-image"
                          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Intro Video/Image (Optional)
                    </label>
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                      {introMedia ? (
                        <div className="space-y-2">
                          <Check className="w-8 h-8 text-green-400 mx-auto" />
                          <p className="text-slate-300">{introMedia.name}</p>
                          <button
                            type="button"
                            onClick={() => setIntroMedia(null)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'intro')}
                            className="hidden"
                            id="intro-media"
                          />
                          <label
                            htmlFor="intro-media"
                            className="cursor-pointer"
                          >
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-400">Upload intro video or image</p>
                            <p className="text-slate-500 text-sm">Max 5MB</p>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Additional Info */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-2xl font-semibold text-white mb-6">Additional Information</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Languages
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedLanguages.map(language => (
                        <span
                          key={language}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-600 text-white"
                        >
                          {language}
                          <button
                            type="button"
                            onClick={() => removeLanguage(language)}
                            className="ml-2 hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {LANGUAGES_OPTIONS.map(language => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => addLanguage(language)}
                          disabled={selectedLanguages.includes(language) || selectedLanguages.length >= 5}
                          className="p-2 text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-colors"
                        >
                          {language}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Timezone
                    </label>
                    <select
                      {...register('timezone')}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select your timezone</option>
                      <option value="UTC-12">UTC-12 (Baker Island)</option>
                      <option value="UTC-11">UTC-11 (American Samoa)</option>
                      <option value="UTC-10">UTC-10 (Hawaii)</option>
                      <option value="UTC-9">UTC-9 (Alaska)</option>
                      <option value="UTC-8">UTC-8 (Pacific Time)</option>
                      <option value="UTC-7">UTC-7 (Mountain Time)</option>
                      <option value="UTC-6">UTC-6 (Central Time)</option>
                      <option value="UTC-5">UTC-5 (Eastern Time)</option>
                      <option value="UTC-4">UTC-4 (Atlantic Time)</option>
                      <option value="UTC-3">UTC-3 (Brazil)</option>
                      <option value="UTC-2">UTC-2 (Mid-Atlantic)</option>
                      <option value="UTC-1">UTC-1 (Azores)</option>
                      <option value="UTC+0">UTC+0 (Greenwich)</option>
                      <option value="UTC+1">UTC+1 (Central European)</option>
                      <option value="UTC+2">UTC+2 (Eastern European)</option>
                      <option value="UTC+3">UTC+3 (Moscow)</option>
                      <option value="UTC+4">UTC+4 (Gulf)</option>
                      <option value="UTC+5">UTC+5 (Pakistan)</option>
                      <option value="UTC+6">UTC+6 (Bangladesh)</option>
                      <option value="UTC+7">UTC+7 (Thailand)</option>
                      <option value="UTC+8">UTC+8 (China)</option>
                      <option value="UTC+9">UTC+9 (Japan)</option>
                      <option value="UTC+10">UTC+10 (Australia)</option>
                      <option value="UTC+11">UTC+11 (Solomon Islands)</option>
                      <option value="UTC+12">UTC+12 (New Zealand)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hourly Rate (Credits per hour)
                    </label>
                    <input
                      {...register('hourlyRate', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="100"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || selectedSkills.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                >
                  {isSubmitting ? 'Completing...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
