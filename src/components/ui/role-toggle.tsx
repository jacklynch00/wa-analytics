'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Crown, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleToggleProps {
	currentRole: 'admin' | 'member';
	onRoleChange: (newRole: 'admin' | 'member') => Promise<void>;
	disabled?: boolean;
	userName: string;
	className?: string;
}

export function RoleToggle({ currentRole, onRoleChange, disabled = false, userName, className }: RoleToggleProps) {
	const [isChanging, setIsChanging] = useState(false);

	const handleToggle = async (checked: boolean) => {
		if (isChanging || disabled) return;

		const newRole = checked ? 'admin' : 'member';
		if (newRole === currentRole) return;

		setIsChanging(true);
		try {
			await onRoleChange(newRole);
		} catch (error) {
			console.error('Failed to change role:', error);
		} finally {
			setIsChanging(false);
		}
	};

	const isAdmin = currentRole === 'admin';

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<div className='flex items-center gap-1 text-xs text-gray-500'>
				<User className='w-3 h-3' />
				<span>Member</span>
			</div>

			<Switch
				checked={isAdmin}
				onCheckedChange={handleToggle}
				disabled={disabled || isChanging}
				className={cn(
					'data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-gray-300',
					isChanging && 'opacity-50 cursor-not-allowed',
					disabled && 'opacity-50 cursor-not-allowed'
				)}
				aria-label={`Toggle ${userName}'s role between member and admin`}
			/>

			<div className='flex items-center gap-1 text-xs text-gray-500'>
				<Crown className='w-3 h-3' />
				<span>Admin</span>
			</div>

			{isChanging && (
				<div className='ml-2'>
					<div className='w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
				</div>
			)}
		</div>
	);
}
