import { Request, Response } from 'express';
import { Track } from '../models/track';
import { User } from '../models/user';

/**
 * Get license settings for all tracks owned by the current user
 */
export const getLicenseSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all tracks owned by the user that are approved or copyrighted
    const tracks = await Track.findAll({
      where: {
        artistId: userId,
        status: ['approved', 'copyrighted']
      },
      attributes: [
        'id', 
        'title', 
        'genre', 
        'status', 
        'isAvailableForLicensing', 
        'licenseFee', 
        'licenseTerms'
      ],
      order: [['title', 'ASC']]
    });

    return res.status(200).json(tracks);
  } catch (error) {
    console.error('Error getting license settings:', error);
    return res.status(500).json({ error: 'Failed to get license settings' });
  }
};

/**
 * Update license settings for a specific track
 */
export const updateTrackLicenseSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const trackId = req.params.id;
    const { isAvailableForLicensing, licenseFee, licenseTerms } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find the track and verify ownership
    const track = await Track.findByPk(trackId);
    
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    if (track.artistId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this track' });
    }
    
    // Only update if track is approved or copyrighted
    if (track.status !== 'approved' && track.status !== 'copyrighted') {
      return res.status(400).json({ 
        error: 'Only approved or copyrighted tracks can have license settings updated' 
      });
    }

    // Update the track's license settings
    await track.update({
      isAvailableForLicensing,
      licenseFee,
      licenseTerms
    });

    return res.status(200).json({ 
      message: 'License settings updated successfully',
      track: {
        id: track.id,
        title: track.title,
        isAvailableForLicensing: track.isAvailableForLicensing,
        licenseFee: track.licenseFee,
        licenseTerms: track.licenseTerms
      }
    });
  } catch (error) {
    console.error('Error updating license settings:', error);
    return res.status(500).json({ error: 'Failed to update license settings' });
  }
};

/**
 * Update license settings for multiple tracks at once
 */
export const updateBulkLicenseSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Expect an array of track objects with id and settings
    const trackUpdates = req.body;
    
    if (!Array.isArray(trackUpdates) || trackUpdates.length === 0) {
      return res.status(400).json({ error: 'No track updates provided' });
    }

    // Extract track IDs from the update data
    const trackIds = trackUpdates.map(track => track.id);

    // Find all tracks owned by the user that match the provided IDs
    const tracks = await Track.findAll({
      where: {
        id: trackIds,
        artistId: userId,
        status: ['approved', 'copyrighted']
      }
    });

    if (tracks.length === 0) {
      return res.status(404).json({ error: 'No eligible tracks found' });
    }

    // Create a map of track IDs to their updates for easier lookup
    const updateMap = trackUpdates.reduce((map, update) => {
      map[update.id] = update;
      return map;
    }, {} as Record<string, typeof trackUpdates[0]>);

    // Update each track's license settings
    const updatePromises = tracks.map(track => {
      const trackUpdate = updateMap[track.id];
      
      if (!trackUpdate) {
        return null; // Skip if no update found for this track
      }
      
      const updates: Record<string, string | number | boolean> = {};
      
      if (trackUpdate.isAvailableForLicensing !== undefined) {
        updates.isAvailableForLicensing = trackUpdate.isAvailableForLicensing;
      }
      
      if (trackUpdate.licenseFee !== undefined) {
        updates.licenseFee = trackUpdate.licenseFee;
      }
      
      if (trackUpdate.licenseTerms !== undefined) {
        updates.licenseTerms = trackUpdate.licenseTerms;
      }
      
      return track.update(updates);
    }).filter(Boolean); // Filter out null promises

    await Promise.all(updatePromises);

    return res.status(200).json({ 
      message: `License settings updated for ${updatePromises.length} tracks`,
      updatedCount: updatePromises.length
    });
  } catch (error) {
    console.error('Error updating bulk license settings:', error);
    return res.status(500).json({ error: 'Failed to update license settings' });
  }
};

/**
 * Get license analytics for the current user's tracks
 */
export const getLicenseAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all tracks owned by the user
    const tracks = await Track.findAll({
      where: {
        artistId: userId,
        status: ['approved', 'copyrighted']
      },
      include: [
        {
          model: User,
          as: 'artist',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    // Count tracks available for licensing
    const availableCount = tracks.filter(track => track.isAvailableForLicensing).length;
    
    // Calculate average license fee
    const availableTracks = tracks.filter(track => track.isAvailableForLicensing);
    const totalFee = availableTracks.reduce((sum, track) => sum + track.licenseFee, 0);
    const averageFee = availableTracks.length > 0 ? Math.round(totalFee / availableTracks.length) : 0;

    return res.status(200).json({
      totalTracks: tracks.length,
      availableForLicensing: availableCount,
      averageLicenseFee: averageFee,
      tracksWithoutFee: availableTracks.filter(track => !track.licenseFee).length
    });
  } catch (error) {
    console.error('Error getting license analytics:', error);
    return res.status(500).json({ error: 'Failed to get license analytics' });
  }
};
