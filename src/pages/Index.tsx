import React from 'react';
import { JoomlaConverter } from '@/components/JoomlaConverter';
import MediaCleanupForm from '@/components/MediaCleanupForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            To-Yoo
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            The Advanced AI Agent for YOOtheme Joomla-managed projects
          </p>
        </div>

        <div className="space-y-12">
          <section id="converter">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">YOOtheme Converter</h2>
            <JoomlaConverter />
          </section>

          <section id="media-cleanup">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Media Cleanup</h2>
            <MediaCleanupForm />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;