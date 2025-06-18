import { Request, Response } from 'express';
import { User } from '../models/user';
import { Track } from '../models/track';
import { License } from '../models/license';
import { OwnershipTransfer } from '../models/ownershipTransfer';

export async function getAdminDashboard(req: Request, res: Response) {
  console.log('getAdminDashboard called');
  try {
    // --- Stats ---
    console.log('Counting stats...');
    const [
      totalArtists, pendingArtists, totalTracks, pendingTracks, approvedTracks, rejectedTracks, blockchainTracks,
      totalLicenses, pendingLicenses, blockchainLicenses,
      totalTransfers, blockchainTransfers
    ] = await Promise.all([
      User.count({ where: { role: 'artist' } }),
      User.count({ where: { role: 'artist', status: 'pending' } }),
      Track.count(),
      Track.count({ where: { status: 'pending' } }),
      Track.count({ where: { status: 'approved' } }),
      Track.count({ where: { status: 'rejected' } }),
      Track.count({ where: { status: 'copyrighted' } }),
      License.count(),
      License.count({ where: { status: 'pending' } }),
      License.count({ where: { status: 'published' } }),
      OwnershipTransfer.count ? OwnershipTransfer.count() : 0,
      OwnershipTransfer.count ? OwnershipTransfer.count({ where: { status: 'published' } }) : 0
    ]);
    console.log('Stats counted:', { totalArtists, pendingArtists, totalTracks, pendingTracks, approvedTracks, rejectedTracks, blockchainTracks, totalLicenses, pendingLicenses, blockchainLicenses, totalTransfers, blockchainTransfers });
    const totalBlockchainRegistrations = blockchainTracks + blockchainLicenses + blockchainTransfers;
    const blockchainFees = 0; // Placeholder, update if you track fees

    // --- Recent Activity ---
    console.log('Fetching recent activity...');
    const recentArtists = await User.findAll({
      where: { role: 'artist' },
      order: [['updatedAt', 'DESC']],
      limit: 5
    });
    const recentTracks = await Track.findAll({
      order: [['updatedAt', 'DESC']],
      limit: 5
    });
    const recentLicenses = await License.findAll({
      order: [['updatedAt', 'DESC']],
      limit: 5
    });
    const recentTransfers = OwnershipTransfer.findAll
      ? await OwnershipTransfer.findAll({ order: [['updatedAt', 'DESC']], limit: 5 })
      : [];
    console.log('Recent activity fetched:', { recentArtists: recentArtists.length, recentTracks: recentTracks.length, recentLicenses: recentLicenses.length, recentTransfers: recentTransfers.length });
    // Map to activity format
    const activities = [
      ...recentArtists.map(a => ({
        title: !a.isVerified ? 'New Artist Registration' : 'Artist Verified',
        description: `${a.firstName} ${a.lastName}`,
        timestamp: (a.updatedAt ?? a.createdAt ?? new Date()).toISOString(),
        status: !a.isVerified ? 'pending' : 'verified',
        type: 'artist'
      })),
      ...recentTracks.map(t => ({
        title: t.status === 'approved' ? 'Track Approved' : t.status === 'rejected' ? 'Track Rejected' : t.status === 'copyrighted' ? 'Copyright Published' : 'Track Submitted',
        description: t.title,
        timestamp: (t.updatedAt ?? t.createdAt ?? new Date()).toISOString(),
        status: t.status === 'copyrighted' ? 'blockchain' : t.status,
        type: 'track',
        txHash: t.blockchainTx || undefined
      })),
      ...recentLicenses.map(l => ({
        title: l.status === 'published' ? 'License Registered' : l.status === 'pending' ? 'License Request Pending' : 'License Updated',
        description: l.purpose || l.id,
        timestamp: (l.updatedAt ?? l.createdAt ?? new Date()).toISOString(),
        status: l.status === 'published' ? 'blockchain' : l.status,
        type: 'license',
        txHash: l.blockchainTx || undefined
      })),
      ...recentTransfers.map(tr => ({
        title: 'Ownership Transfer',
        description: `${tr.currentOwnerId} → ${tr.newOwnerId}`,
        timestamp: (tr.updatedAt ?? tr.createdAt ?? new Date()).toISOString(),
        status: tr.status === 'published' ? 'blockchain' : tr.status,
        type: 'transfer',
        txHash: tr.blockchainTx || undefined
      }))
    ];

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activities.slice(0, 20);

    res.json({
      stats: {
        totalArtists,
        pendingArtists,
        totalTracks,
        pendingTracks,
        approvedTracks,
        rejectedTracks,
        blockchainTracks,
        pendingLicenses,
        totalLicenses,
        blockchainLicenses,
        totalTransfers,
        blockchainTransfers,
        totalBlockchainRegistrations,
        blockchainFees
      },
      recentActivity
    });
    console.log('Dashboard response sent');
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data.', details: err instanceof Error ? err.message : err });
  }
}
