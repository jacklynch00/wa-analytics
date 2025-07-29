/**
 * Role-based Access Control (RBAC) Components
 * 
 * These components provide efficient role-based access control throughout the application.
 * Uses TanStack React Query for caching and data management.
 * 
 * Usage Examples:
 * 
 * 1. Basic Role Guard:
 * ```tsx
 * <RoleGuard allowedRoles={['admin']} fallback={<div>Access denied</div>}>
 *   <AdminOnlyButton />
 * </RoleGuard>
 * ```
 * 
 * 2. Admin Only (convenience component):
 * ```tsx
 * <AdminOnly fallback={<div>Admins only</div>}>
 *   <EditButton />
 * </AdminOnly>
 * ```
 * 
 * 3. Member or Admin:
 * ```tsx
 * <MemberOrAdmin>
 *   <ViewTeamButton />
 * </MemberOrAdmin>
 * ```
 * 
 * 4. Using the hook:
 * ```tsx
 * const { data: userRole, isLoading } = useUserRole();
 * const isAdmin = userRole?.role === 'admin';
 * 
 * if (isLoading) return <Spinner />;
 * if (isAdmin) return <AdminPanel />;
 * return <MemberPanel />;
 * ```
 * 
 * 5. Conditional rendering with organization check:
 * ```tsx
 * <RoleGuard allowedRoles={['admin']} organizationId="specific-org-id">
 *   <CrossOrgAdminFeature />
 * </RoleGuard>
 * ```
 */

'use client';

import { useUserRole } from '@/hooks/useOrganization';

type UserRole = 'admin' | 'member';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  organizationId?: string;
}

export function RoleGuard({ children, allowedRoles, fallback = null, organizationId }: RoleGuardProps) {
  const { data: userRole, isLoading } = useUserRole();

  // Show loading state
  if (isLoading) {
    return null;
  }

  // Check if user has required role
  const hasRequiredRole = userRole && allowedRoles.includes(userRole.role);
  
  // If organizationId is specified, also check if user belongs to that organization
  const belongsToOrganization = !organizationId || (userRole?.organizationId === organizationId);

  if (hasRequiredRole && belongsToOrganization) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback, organizationId }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback} organizationId={organizationId}>
      {children}
    </RoleGuard>
  );
}

export function MemberOrAdmin({ children, fallback, organizationId }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['member', 'admin']} fallback={fallback} organizationId={organizationId}>
      {children}
    </RoleGuard>
  );
}

// Export the hook from the organization hooks for convenience
export { useUserRole } from '@/hooks/useOrganization';