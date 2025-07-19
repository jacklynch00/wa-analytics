import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
	'inline-flex items-center justify-center rounded-[var(--radius-pill)] border px-2 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,background-color] overflow-hidden',
	{
		variants: {
			variant: {
				default: 'border-transparent bg-[var(--brand)] text-white [a&]:hover:bg-[var(--button-primary-hover)]',
				secondary: 'border-transparent bg-[var(--card-hover-bg)] text-[var(--text-secondary)] [a&]:hover:bg-[var(--border)]',
				destructive: 'border-transparent bg-[var(--warning)] text-white [a&]:hover:bg-[#d93025]',
				outline: 'text-[var(--text-primary)] border-[var(--border)] bg-transparent [a&]:hover:bg-[var(--card-hover-bg)]',
				nutrition: 'bg-[var(--tag-nutrition-bg)] text-[var(--tag-nutrition-color)] border border-[var(--tag-nutrition-border)]',
				streaming: 'bg-[var(--tag-streaming-bg)] text-[var(--tag-streaming-color)] border border-[var(--tag-streaming-border)]',
				security: 'bg-[var(--tag-security-bg)] text-[var(--tag-security-color)] border border-[var(--tag-security-border)]',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'span';

	return <Comp data-slot='badge' className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
