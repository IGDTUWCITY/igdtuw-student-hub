import { motion } from 'framer-motion';
import { Linkedin, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AboutUs() {
  const founders = [
    {
       name: "Joysa Jain",
      role: "Founder & Developer",
      description: "B.Tech CSE-AI 3rd Year Student. Former Intern at Cisco. The major visionary behind IGDTUW City, combining technical expertise with creative insight to revolutionize the campus digital experience.",
      linkedin: "https://www.linkedin.com/in/joysa-jain-86b589283/",
      image: "joysa.jpeg",
      initials: "JJ"
    },
    {
      name: "Aarohi Chadha",
      role: "Founder & Developer",
      description: "B.Tech CSE-AI 3rd Year Student. Former Intern at Google, driving the evolution of IGDTUW City into a scalable,campus platform through continuous architectural and product enhancement.",
      linkedin: "https://www.linkedin.com/in/aarohi-chadha/",
      image: "aarohi.jpeg",
      initials: "AC"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-1 space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4 pt-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold text-foreground"
          >
            About Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Building the future of student connectivity at IGDTUW.
          </motion.p>
        </div>

        {/* Founders Section */}
        <section>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-display font-semibold text-primary">Meet the Founders</h2>
            <div className="w-24 h-1 bg-primary/20 mx-auto mt-4 rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            {founders.map((founder, index) => (
              <motion.div
                key={founder.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="h-full"
              >
                <Card className="h-full border-border/50 bg-gradient-to-b from-card to-muted/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-300 overflow-hidden group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-2 bg-gradient-to-r from-orange-400 via-primary to-purple-500" />
                  <CardHeader className="text-center pb-2 relative z-10">
                    <div className="mx-auto w-36 h-36 rounded-full p-1.5 bg-gradient-to-br from-orange-400 via-primary to-purple-500 mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                      <Avatar className="w-full h-full border-4 border-background shadow-inner">
                        <AvatarImage src={founder.image} alt={founder.name} className="object-cover" />
                        <AvatarFallback className="text-3xl font-bold bg-muted text-primary/80">
                          {founder.initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">{founder.name}</CardTitle>
                    <CardDescription className="text-primary font-semibold text-lg mt-1 tracking-wide">{founder.role}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-6 relative z-10">
                    <p className="text-muted-foreground leading-relaxed text-base px-2">
                      {founder.description}
                    </p>
                    <div className="flex justify-center pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md" 
                        asChild
                      >
                        <a href={founder.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="w-4 h-4" />
                          Connect on LinkedIn
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 py-8 border-t border-border text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Mail className="w-4 h-4" />
          <span>For any queries contact us at</span>
        </div>
        <a 
          href="mailto:igdtuwcity@gmail.com" 
          className="text-primary hover:underline font-medium block"
        >
          igdtuwcity@gmail.com
        </a>
      </motion.footer>
    </div>
  );
}
