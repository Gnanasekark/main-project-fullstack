import { motion } from 'framer-motion';
import { Upload, Users, Send, Download, ArrowDown } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Excel',
    description: 'Teacher uploads an Excel template. System parses and creates an online form.',
    role: 'Teacher',
  },
  {
    icon: Users,
    title: 'Assign to Groups',
    description: 'Select students or groups. They get notified instantly via all channels.',
    role: 'Teacher',
  },
  {
    icon: Send,
    title: 'Students Submit',
    description: 'Students login, see pending forms, fill and submit. Progress is tracked.',
    role: 'Student',
  },
  {
    icon: Download,
    title: 'Export Responses',
    description: 'Download all responses as Excel. Same format, complete data, ready to use.',
    role: 'Teacher',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="container px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Four simple steps to transform your data collection workflow
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative"
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="flex items-start gap-6 mb-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                    <step.icon className="w-7 h-7 text-primary" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      {step.role}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-20 h-8 w-px bg-border flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-muted-foreground animate-pulse-soft" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
