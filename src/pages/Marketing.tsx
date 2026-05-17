/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageWrapper, Header, Card } from '../components/Common.tsx';
import { useStore } from '../store.tsx';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Sparkles, 
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Phone
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils.ts';
import { motion } from 'motion/react';

export default function Marketing() {
  const { customers, scheduledMessages, addScheduledMessage, t, launchCampaign } = useStore();
  const [selectedSegment, setSelectedSegment] = useState("allCustomers");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const generateAITemplate = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Create a persuasive, short, and friendly Arabic marketing message for a perfume retail shop called 'ScentFlow'. The message should offer a 15% discount for customers who haven't visited in 30 days. Mention that we have new Oud combinations. Use emojis. Provide only the text.",
        config: {
            systemInstruction: "You are a professional marketing copywriter for a high-end perfume brand in Egypt."
        }
      });
      setGeneratedMessage(response.text || "");
    } catch (err) {
      console.error(err);
      setGeneratedMessage("Discover our new winter collection at ScentFlow! Visit us today for a special 15% discount on your favorite Oud mixes. ✨🌙");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLaunch = async () => {
    if (!generatedMessage.trim()) return;
    setIsLaunching(true);
    try {
      // Simulation of sending WhatsApp to all selected customers
      const targetCustomers = selectedSegment === 'allCustomers' ? customers : customers.slice(0, 5);
      console.log(`Sending WhatsApp to ${targetCustomers.length} customers:`, generatedMessage);
      
      await launchCampaign(selectedSegment, generatedMessage);
      alert(`${t('transactionComplete')} - Sent to ${targetCustomers.length} customers via WhatsApp`);
      setGeneratedMessage("");
    } finally {
      setIsLaunching(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addScheduledMessage({
      message: generatedMessage,
      segment: selectedSegment,
      time: formData.get('time'),
      date: formData.get('date'),
    });
    setShowScheduleModal(false);
    alert(t('transactionComplete'));
  };

  return (
    <PageWrapper>
      <Header 
        title={t('marketingEngine')} 
        subtitle={t('marketingSubtitle')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1 space-y-4">
           <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t('targetSegments')}</label>
           {[
             { name: "allCustomers", count: customers.length, icon: Users },
             { name: "topSpenders", count: Math.ceil(customers.length * 0.1), icon: Sparkles },
             { name: "favOud", count: Math.ceil(customers.length * 0.4), icon: Layers },
             { name: "churning", count: Math.ceil(customers.length * 0.2), icon: Calendar }
           ].map(seg => (
             <div 
              key={seg.name}
              onClick={() => setSelectedSegment(seg.name)}
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                selectedSegment === seg.name ? "bg-amber-600 border-amber-600 shadow-lg shadow-amber-900/20" : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
              )}
            >
               <div className="flex items-center gap-3">
                  <seg.icon className={cn("w-4 h-4 md:w-5 md:h-5", selectedSegment === seg.name ? "text-white" : "text-zinc-600")} />
                  <span className={cn("text-sm font-bold", selectedSegment === seg.name ? "text-white" : "text-zinc-300")}>{t(seg.name as any)}</span>
               </div>
               <span className={cn("text-[10px] font-mono font-bold", selectedSegment === seg.name ? "text-amber-200" : "text-zinc-500")}>
                  {seg.count}
               </span>
             </div>
           ))}

            <div className="pt-6 space-y-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">{t('liveStatus')}</label>
              <Card className="bg-zinc-950 border-emerald-500/20">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                       <Phone className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-white">{t('whatsappConnected')}</p>
                       <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{t('instanceReady')}</p>
                    </div>
                 </div>
              </Card>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" /> {t('scheduleCampaign')}
              </button>
            </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <Card className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-white">{t('campaignComposer')}</h3>
                <button 
                  onClick={generateAITemplate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {t('generateAI')}
                </button>
              </div>

              <div className="relative">
                 <textarea 
                  rows={8}
                  placeholder={t('typeMessage')}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 focus:outline-none focus:border-amber-600 transition-all font-medium text-white resize-none text-sm md:text-base"
                  value={generatedMessage}
                  onChange={(e) => setGeneratedMessage(e.target.value)}
                 />
                 <div className="absolute bottom-4 right-6 flex gap-4 text-zinc-600 text-[10px] font-mono">
                    <span>{generatedMessage.length} {t('characters')}</span>
                    <span>•</span>
                    <span>{t('creditPerRecipient')}</span>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-900 gap-4">
                 <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                       {[1,2,3].map(i => (
                         <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                            {i}
                         </div>
                       ))}
                       <div className="w-8 h-8 rounded-full bg-amber-600 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white">
                          +{customers.length > 3 ? customers.length - 3 : 0}
                       </div>
                    </div>
                    <p className="text-xs text-zinc-400">
                       {t('recipientsFrom')} <span className="text-white font-bold">{t(selectedSegment as any)}</span>
                    </p>
                 </div>
                 <button 
                  onClick={handleLaunch}
                  disabled={isLaunching || !generatedMessage}
                  className="w-full md:w-auto px-8 py-3 bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20"
                >
                    {isLaunching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
                    {t('launchCampaign')}
                 </button>
              </div>
           </Card>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card title={t('marketingInsights')}>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-zinc-500">{t('openRate')} (Last Campaign)</span>
                       <span className="text-emerald-500 font-bold">84.2%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-zinc-500">{t('conversionRate')}</span>
                       <span className="text-amber-500 font-bold">12.5%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-zinc-500">{t('roiPercentage')}</span>
                       <span className="text-blue-500 font-bold">340%</span>
                    </div>
                 </div>
              </Card>

              <Card title={t('scheduledMessages')}>
                 <div className="flex flex-col h-full">
                    {scheduledMessages && scheduledMessages.length > 0 ? (
                      <div className="space-y-3">
                        {scheduledMessages.map((m, i) => (
                          <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                            <div className="text-start">
                              <p className="text-xs font-bold text-white truncate w-32">{m.message}</p>
                              <p className="text-[10px] text-zinc-500">{m.date} at {m.time}</p>
                            </div>
                            <span className="px-2 py-1 bg-amber-600/10 text-amber-500 text-[10px] font-bold rounded-lg">{m.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-zinc-700 opacity-50">
                        <Calendar className="w-10 h-10 md:w-12 md:h-12 mb-2" />
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{t('noPending')}</p>
                      </div>
                    )}
                 </div>
              </Card>
           </div>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)} />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8"
          >
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">{t('scheduleCampaign')}</h3>
            <form onSubmit={handleSchedule} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('date')}</label>
                <input type="date" name="date" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{t('time')}</label>
                <input type="time" name="time" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white" />
              </div>
              <button className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest">
                {t('confirmMix')}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
}
