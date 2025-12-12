import { headers } from 'next/headers';
import { prisma } from '@/db/prisma';
import { getProtocol, isProduction } from './domain-utils';

/**
 * Extract subdomain from host
 */
function getSubdomainFromHost(host: string, rootDomain: string | undefined): string | null {
  if (!rootDomain) return null;
  
  const bareHost = host.split(':')[0].toLowerCase();
  const rootLower = rootDomain.toLowerCase();
  
  // Handle localhost subdomains (e.g., ilovegod.localhost:3000)
  if (bareHost.includes('localhost')) {
    const parts = bareHost.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www') {
      return parts[0];
    }
    return null;
  }
  
  // Handle production subdomains (e.g., subdomain.rooms4rentlv.com)
  if (bareHost !== rootLower && bareHost.endsWith(`.${rootLower}`)) {
    const subdomain = bareHost.slice(0, bareHost.length - rootLower.length - 1);
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }
  
  return null;
}

/**
 * Build absolute URL for subdomain redirect
 * Only used when redirecting from main domain to subdomain
 */
function buildSubdomainUrl(subdomain: string, rootDomain: string, path: string, host: string): string {
  const protocol = getProtocol(host);
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  
  if (isLocalhost) {
    // For localhost, use the subdomain.localhost format
    const port = host.includes(':') ? host.split(':')[1] : '3000';
    return `${protocol}://${subdomain}.localhost:${port}${path}`;
  }
  
  // For production, use subdomain.rootdomain.com
  return `${protocol}://${subdomain}.${rootDomain}${path}`;
}

export async function getSubdomainRedirectUrl(userRole: string, userId: string): Promise<string> {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils/subdomain-redirect.ts:52',message:'getSubdomainRedirectUrl called',data:{userRole,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Get the current host to detect subdomain
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const rawApex = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'rooms4rentlv.com';

    const bareHost = host.split(':')[0].toLowerCase();
    const currentSubdomain = getSubdomainFromHost(host, rawApex);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils/subdomain-redirect.ts:60',message:'Subdomain detection',data:{host,bareHost,currentSubdomain,rawApex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // If we're already on a subdomain, verify the user belongs to this landlord
    if (currentSubdomain) {
      const landlord = await prisma.landlord.findUnique({
        where: { subdomain: currentSubdomain },
      });

      if (landlord) {
        // Check if user is associated with this landlord
        const userAssociation = await prisma.user.findFirst({
          where: {
            id: userId || '',
            OR: [
              // User is the landlord owner
              { id: landlord.ownerUserId || '' },
              // User is a tenant of this landlord
              {
                leasesAsTenant: {
                  some: {
                    unit: {
                      property: {
                        landlordId: landlord.id,
                      },
                    },
                  },
                },
              },
            ],
          },
        });

        if (userAssociation) {
          // User belongs to this landlord's subdomain
          // For landlords/property managers, always go to main-domain admin (avoid subdomain-admin)
          // For tenants, allow staying on subdomain
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils/subdomain-redirect.ts:92',message:'User belongs to subdomain landlord',data:{userRole,userId,subdomain:currentSubdomain,landlordId:landlord.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          switch (userRole) {
            case 'landlord':
            case 'property_manager': {
              // Build absolute main-domain URL to escape subdomain
              const protocol = getProtocol(host);
              const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
              if (isLocalhost) {
                const port = host.includes(':') ? host.split(':')[1] : '3000';
                return `${protocol}://localhost:${port}/admin/overview`;
              }
              return `/${''}admin/overview`;
            }
            case 'tenant':
              return '/user/dashboard';
            default:
              return '/';
          }
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils/subdomain-redirect.ts:104',message:'User does not belong to subdomain',data:{userRole,userId,subdomain:currentSubdomain,landlordId:landlord.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          // User doesn't belong to this subdomain, redirect to main domain
          const protocol = getProtocol(host);
          const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
          if (isLocalhost) {
            const port = host.includes(':') ? host.split(':')[1] : '3000';
            return `${protocol}://localhost:${port}/`;
          }
          return '/';
        }
      } else {
        // Subdomain doesn't exist, redirect to main domain
        const protocol = getProtocol(host);
        const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
        if (isLocalhost) {
          const port = host.includes(':') ? host.split(':')[1] : '3000';
          return `${protocol}://localhost:${port}/`;
        }
        return '/';
      }
    }

    // Not on a subdomain, redirect based on role
    switch (userRole) {
      case 'landlord': {
        // Landlords always go to main admin dashboard on sign-in
        // They can visit their subdomain from the admin/branding page if they want
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils/subdomain-redirect.ts:138',message:'Landlord redirect to main domain admin',data:{userRole,userId,redirectTo:'/admin/overview'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return '/admin/overview';
      }
      case 'property_manager':
        // For now, redirect property managers to main admin dashboard
        // TODO: Implement property manager to landlord association when schema supports it
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils/subdomain-redirect.ts:140',message:'Property manager redirect',data:{userRole,userId,redirectTo:'/admin'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return '/admin/overview';
      case 'tenant': {
        // Find which landlord this tenant rents from
        const tenantLease = await prisma.lease.findFirst({
          where: {
            tenantId: userId || '',
            status: 'active',
          },
          include: {
            unit: {
              include: {
                property: {
                  include: { landlord: true },
                },
              },
            },
          },
        });

        if (tenantLease?.unit?.property?.landlord?.subdomain && tenantLease.unit.property.landlord.useSubdomain) {
          // Redirect to subdomain using absolute URL
          return buildSubdomainUrl(
            tenantLease.unit.property.landlord.subdomain,
            rawApex,
            '/user/dashboard',
            host
          );
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils/subdomain-redirect.ts:171',message:'Tenant redirect to main domain',data:{userRole,userId,redirectTo:'/user/dashboard',hasSubdomain:!!tenantLease?.unit?.property?.landlord?.subdomain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return '/user/dashboard';
      }
      default:
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils/subdomain-redirect.ts:174',message:'Default redirect',data:{userRole,userId,redirectTo:'/'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return '/';
    }
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/utils/subdomain-redirect.ts:177',message:'Error in getSubdomainRedirectUrl',data:{userRole,userId,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Error determining subdomain redirect:', error);
    return '/'; // Fallback to home
  }
}
