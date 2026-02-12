import { motion } from 'framer-motion';
import { 
  Upload, 
  Users, 
  ClipboardCheck, 
  Bell, 
  Download, 
  Shield,
  Zap,
  BarChart3
} from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Excel Upload',
    description: 'Upload any Excel file and our system auto-generates a clean, mobile-friendly form.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Users,
    title: 'Smart Grouping',
    description: 'Students are auto-grouped by Degree, Branch, Year, and Section upon registration.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: ClipboardCheck,
    title: 'Form Assignments',
    description: 'Assign forms to individual students or entire groups with just a few clicks.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Bell,
    title: 'Auto Reminders',
    description: 'Set reminder intervals and times. System auto-sends via Email, WhatsApp, and In-App.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: BarChart3,
    title: 'Real-time Tracking',
    description: 'Monitor submitted vs pending with timestamps. Never lose track of responses.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    icon: Download,
    title: 'Excel Export',
    description: 'Download all responses back to Excel with a single click. Same format, filled data.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Admins manage users, teachers create forms, students submit. Clear permissions.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: Zap,
    title: 'Instant Response',
    description: 'No page reloads. Real-time updates. Fast, modern, and reliable experience.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="text-gradient">Collect Data Efficiently</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From Excel upload to response export, FormFlow handles the entire workflow 
            so you can focus on what matters most.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="p-6 rounded-2xl bg-card border border-border/50 card-hover"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
