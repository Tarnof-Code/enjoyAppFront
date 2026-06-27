import { useEffect, useState } from 'react';

import { utilisateurService } from '../services/utilisateur.service';
import { useAppSelector } from '../store/hooks';

interface MembrePhotoProfil {
  tokenId: string;
  photoProfilUrl?: string | null;
}

/** Charge les photos de profil des membres qui ont une `photoProfilUrl` (liste équipe, etc.). */
export function usePhotosProfilEquipe(membres: MembrePhotoProfil[], refreshKey = 0) {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const tokenIdConnecte = useAppSelector((state) => state.auth.tokenId);
  const photoConnecte = useAppSelector((state) => state.auth.photoProfilUri);

  useEffect(() => {
    const avecPhoto = membres.filter((m) => m.photoProfilUrl);
    if (avecPhoto.length === 0) {
      setPhotos({});
      return;
    }

    let annule = false;

    Promise.all(
      avecPhoto.map(async (membre) => {
        if (membre.tokenId === tokenIdConnecte && photoConnecte) {
          return { tokenId: membre.tokenId, uri: photoConnecte };
        }
        const uri = await utilisateurService
          .getPhotoProfilDataUri(membre.tokenId)
          .catch(() => null);
        return { tokenId: membre.tokenId, uri };
      }),
    )
      .then((resultats) => {
        if (annule) return;
        const map: Record<string, string> = {};
        for (const { tokenId, uri } of resultats) {
          if (uri) map[tokenId] = uri;
        }
        setPhotos(map);
      })
      .catch(() => {
        if (!annule) setPhotos({});
      });

    return () => {
      annule = true;
    };
  }, [membres, tokenIdConnecte, photoConnecte, refreshKey]);

  return photos;
}
