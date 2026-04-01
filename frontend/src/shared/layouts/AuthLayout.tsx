import { Outlet } from 'react-router-dom';
import { CalendarCheck2, Ticket } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export function AuthLayout() {
  const ringStyleClass = 'auth-ring-ultra-crisp';

  return (
    <div className={`auth-page ${ringStyleClass} relative min-h-screen overflow-hidden text-foreground`}>
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
      <div className="auth-orb auth-orb-4" />
      <div className="auth-center-glow" />

      <div className="auth-sphere" />
      <div className="auth-sphere auth-sphere-top-right" />
      <div className="auth-sphere auth-sphere-bottom-center" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <section className="hidden lg:col-span-7 lg:block">
            <div className="max-w-3xl">
              <h1 className="whitespace-nowrap text-6xl font-black leading-tight text-foreground xl:text-5xl">
                SmartCampus Management
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-foreground/70">
                Manage academics, resources, bookings, tickets, and notifications in one smart platform.
              </p>

              <div className="mt-10 grid gap-5 md:grid-cols-2 md:grid-rows-2">
                <div className="auth-feature-card auth-feature-card-tall md:row-span-2" />

                <div className="auth-feature-card md:col-start-2 md:row-start-1">
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarCheck2 className="h-5 w-5 text-primary" />
                    <p className="text-lg font-semibold text-foreground">Booking Resources</p>
                  </div>
                  <p className="mt-1 text-sm text-foreground/70">Reserve labs, halls, and campus facilities quickly with real-time availability.</p>
                </div>

                <div className="auth-feature-card md:col-start-2 md:row-start-2">
                  <div className="mb-2 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    <p className="text-lg font-semibold text-foreground">Ticket Raising</p>
                  </div>
                  <p className="mt-1 text-sm text-foreground/70">Report issues and track support tickets from submission to resolution.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-5">
            <div className="mx-auto w-full max-w-md auth-glass-card p-6 sm:p-8">
              <Outlet />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
