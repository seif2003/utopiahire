"use client";

import React from 'react';
import { Briefcase, MenuIcon, LogOut, User } from 'lucide-react';
import { Sheet, SheetContent, SheetFooter } from '@/components/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface FloatingHeaderProps {
	userEmail?: string | null;
	profilePicture?: string | null;
}

export function FloatingHeader({ userEmail, profilePicture }: FloatingHeaderProps) {
	const [open, setOpen] = React.useState(false);
	const [showDropdown, setShowDropdown] = React.useState(false);
	const router = useRouter();
	const dropdownRef = React.useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
			}
		};

		if (showDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showDropdown]);

	const links = [
		{
			label: 'Job Offers',
			href: '/main',
		},
		{
			label: 'My Jobs',
			href: '/main/my-jobs',
		},
		{
			label: 'My Resume',
			href: '/main/my-resume',
		},
		{
			label: 'Edit Profile',
			href: '/main/edit-profile',
		},
	];

	const getInitials = (email: string) => {
		return email.substring(0, 2).toUpperCase();
	};

	const handleLogout = async () => {
		try {
			await fetch('/auth/logout', { method: 'POST' });
			router.push('/');
			router.refresh();
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};

	return (
		<header
			className={cn(
				'fixed top-5 left-1/2 -translate-x-1/2 z-50',
				'mx-auto w-full max-w-3xl rounded-lg border shadow',
				'bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg',
			)}
		>
			<nav className="mx-auto flex items-center justify-between p-1.5">
				<a href="/" >
				<div className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 duration-100">
					<img src="/logo1.png" alt="Utopia Hire Logo" className="h-8 w-8"/>
					<p className="font-mono text-base font-bold text-primary">Utopia Hire</p>
				</div>
				</a>
				<div className="hidden items-center gap-1 lg:flex">
					{links.map((link) => (
						<a
							className={buttonVariants({ variant: 'ghost', size: 'sm' })}
							href={link.href}
							key={link.label}
						>
							{link.label}
						</a>
					))}
				</div>
				<div className="flex items-center gap-2">
					{userEmail ? (
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => setShowDropdown(!showDropdown)}
								className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity border-2 border-primary/20"
							>
								{profilePicture ? (
									<Image
										src={profilePicture}
										alt="Profile"
										width={36}
										height={36}
										className="object-cover w-full h-full"
									/>
								) : (
									<User className="w-5 h-5" />
								)}
							</button>
							{showDropdown && (
								<div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover shadow-lg z-50">
									<div className="px-3 py-2 text-sm border-b">
										<p className="font-medium truncate">{userEmail}</p>
									</div>
									<button
										onClick={handleLogout}
										className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors rounded-b-md"
									>
										<LogOut className="h-4 w-4" />
										Logout
									</button>
								</div>
							)}
						</div>
					) : (
						<Button size="sm" onClick={() => router.push('/auth/login')}>
							Login
						</Button>
					)}
					<Sheet open={open} onOpenChange={setOpen}>
						<Button
							size="icon"
							variant="outline"
							onClick={() => setOpen(!open)}
							className="lg:hidden"
						>
							<MenuIcon className="size-4" />
						</Button>
						<SheetContent
							className="bg-background/95 supports-[backdrop-filter]:bg-background/80 gap-0 backdrop-blur-lg"
							showClose={false}
							side="left"
						>
							<div className="grid gap-y-2 overflow-y-auto px-4 pt-12 pb-5">
								{links.map((link) => (
									<a
										className={buttonVariants({
											variant: 'ghost',
											className: 'justify-start',
										})}
										href={link.href}
									>
										{link.label}
									</a>
								))}
							</div>
							<SheetFooter>
								<Button variant="outline">Sign In</Button>
								<Button>Get Started</Button>
							</SheetFooter>
						</SheetContent>
					</Sheet>
				</div>
			</nav>
		</header>
	);
}
