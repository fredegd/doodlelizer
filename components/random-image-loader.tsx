import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw, Info } from "lucide-react"


interface RandomImageLoaderProps {
    onImageSelected: (imageUrl: string) => void;
    onCancel: () => void;
}

const MAX_RETRIES = 3;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * Fetches a random image URL, source URL, and title from Wikimedia Commons.
 * It ensures the fetched file is a supported image type.
 * @throws {Error} If fetching or validation fails.
 */
async function fetchAndValidateImage(): Promise<{ imageUrl: string, sourceUrl: string, title: string }> {
    // Wikimedia Commons API endpoint for a random file in the File namespace (ns=6)
    // origin=* is added for CORS.
    // For production applications, consider adding a User-Agent header via a backend proxy if direct client-side requests become problematic
    // or if Wikimedia's API usage policies require it for higher traffic.
    const randomTitleApiUrl = 'https://commons.wikimedia.org/w/api.php?action=query&list=random&rnnamespace=6&rnlimit=1&format=json&origin=*';

    const randomTitleResponse = await fetch(randomTitleApiUrl);
    if (!randomTitleResponse.ok) {
        throw new Error('Failed to fetch a random file title from Wikimedia Commons. Network response was not ok.');
    }
    const randomTitleData = await randomTitleResponse.json();

    const page = randomTitleData?.query?.random?.[0];
    if (!page || !page.title) {
        throw new Error('No random file title found in Wikimedia Commons API response.');
    }
    const title: string = page.title;

    // Fetch image information (URL, MIME type) using the obtained file title
    const imageInfoApiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|mime|size&titles=${encodeURIComponent(title)}&format=json&origin=*`;

    const imageInfoResponse = await fetch(imageInfoApiUrl);
    if (!imageInfoResponse.ok) {
        throw new Error(`Failed to fetch image information for "${title}". Network response was not ok.`);
    }
    const imageInfoData = await imageInfoResponse.json();

    const pages = imageInfoData?.query?.pages;
    const pageId = Object.keys(pages || {})[0];
    const imageInfoArr = pages?.[pageId]?.imageinfo;

    if (!imageInfoArr || imageInfoArr.length === 0) {
        console.warn(`No imageinfo found for ${title}. This might be a non-image file, a redirect, or an issue with the API response.`);
        throw new Error(`No image information available for file: ${title}. It might not be a direct image file.`);
    }

    const imageInfo = imageInfoArr[0];

    if (!imageInfo.url || !imageInfo.mime || !ALLOWED_MIME_TYPES.includes(imageInfo.mime.toLowerCase())) {
        console.warn(`File ${title} (mime: ${imageInfo.mime}) is not a supported image type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}.`);
        throw new Error(`Unsupported file type: ${imageInfo.mime}. Please try loading another image.`);
    }

    return {
        imageUrl: imageInfo.url,
        sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
        title
    };
}

const RandomImageLoader: React.FC<RandomImageLoaderProps> = ({ onImageSelected, onCancel }) => {
    const [currentImage, setCurrentImage] = useState<{ imageUrl: string, sourceUrl: string, title: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retries, setRetries] = useState(0);

    const attemptLoadImage = useCallback(async (isInitialAttempt: boolean) => {
        setIsLoading(true);
        if (isInitialAttempt) { // Clear previous errors only on a fresh user-initiated attempt or very first load
            setError(null);
        }

        try {
            const imageData = await fetchAndValidateImage();
            setCurrentImage(imageData);
            setError(null); // Clear any previous error on success
            setRetries(0); // Reset retries on successful load
        } catch (err) {
            console.error("Error loading image:", err);
            if (retries < MAX_RETRIES - 1) { // Check retries before incrementing for the next attempt
                setRetries(prev => prev + 1); // Increment retries, useEffect will trigger next attempt
                // Error is not set yet, to allow retries. It will be set if all retries fail.
            } else {
                // All retries exhausted
                setError(err instanceof Error ? err.message : 'An unknown error occurred after multiple retries.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [retries]); // Depends on retries to manage the retry count and re-create the function if retries changes.

    // Effect for initial load and automatic retries
    useEffect(() => {
        if (!currentImage && retries < MAX_RETRIES && !error) { // If no image, within retry limit, and no persistent error
            const delay = retries === 0 ? 0 : 1000 * retries; // No delay for first attempt, increasing delay for retries
            const timer = setTimeout(() => {
                attemptLoadImage(retries === 0); // isInitialAttempt is true only if retries is 0
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [retries, currentImage, error, attemptLoadImage]);

    const handleUseThisImage = () => {
        if (currentImage) {
            onImageSelected(currentImage.imageUrl);
        }
    };

    const handleLoadAnotherImage = () => {
        setCurrentImage(null); // Clear current image
        setRetries(0);       // Reset retries to start fresh
        setError(null);      // Clear any existing error
        setIsLoading(true);  // Set loading state immediately
        // The useEffect will pick up the reset 'retries' and 'currentImage' and call attemptLoadImage(true)
    };

    if (isLoading && !currentImage) {
        return (
            <div className="flex flex-col items-center justify-center h-96 min-h-[300px] border border-dashed border-gray-600 rounded-lg p-8 bg-gray-800 text-gray-300">
                <p className="text-xl mb-3">Fetching a random image from Wikimedia Commons...</p>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-100 mb-3"></div>
                {retries > 0 && <p className="text-sm text-gray-400">Attempt {retries + 1} of {MAX_RETRIES}. Please wait...</p>}
                <p className="text-xs text-gray-500 mt-4">You can also upload an image manually below or cancel.</p>
                <Button onClick={onCancel} variant="outline" className="mt-4">Cancel</Button>
            </div>
        );
    }

    if (error && !currentImage) {
        return (
            <div className="flex flex-col items-center justify-center h-96 min-h-[300px] border border-dashed border-red-500 rounded-lg p-8 bg-gray-800 text-red-300">
                <p className="text-xl font-semibold mb-2">Oops! Failed to load an image.</p>
                <p className="text-sm mb-4 text-center max-w-md">{error}</p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button onClick={handleLoadAnotherImage} variant="default">Try Again</Button>
                    <Button onClick={onCancel} variant="secondary">Cancel</Button>
                </div>
            </div>
        );
    }

    if (currentImage) {
        return (
            <div className="flex flex-col items-center p-4 sm:p-6 border border-gray-700 rounded-lg bg-gray-800 shadow-lg">
                <div className="mb-4 w-full max-w-lg  bg-gray-700 rounded overflow-hidden flex items-center justify-center shadow-md">
                    <img
                        src={currentImage.imageUrl}
                        alt={currentImage.title || 'Random Wikimedia Image'}
                        className="max-w-full max-h-[40vh] sm:max-h-[50vh] object-contain"
                        onError={() => {
                            // This is a fallback if the image URL itself is broken after all checks
                            setError("The image could not be loaded from the source. It might be invalid or removed.");
                            setCurrentImage(null);
                            setRetries(MAX_RETRIES); // Prevent further retries for this image
                        }}
                    />
                </div>
                <p className="text-sm text-gray-400 mb-1 max-w-full truncate" title={currentImage.title}>
                    Title: <span className="font-medium text-gray-300">{currentImage.title}</span>
                </p>
                <a href={currentImage.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 hover:underline mb-6">
                    View source on Wikimedia Commons
                </a>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                    <Button onClick={handleUseThisImage} variant="outline" className="border-gray-500 text-black hover:bg-gray-500 hover:text-white">
                        Use this Image
                    </Button>
                    <Button onClick={handleLoadAnotherImage} variant="outline" className="border-gray-500 text-black hover:bg-gray-500 hover:text-white">
                        Reload
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button onClick={onCancel} variant="ghost" className="text-black border border-red-500 bg-red-400 hover:bg-red-500 hover:text-white">
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    // Fallback UI for unexpected state, offer cancel
    return (
        <div className="flex flex-col items-center justify-center h-96 border border-dashed border-gray-600 rounded-lg p-8 bg-gray-800 text-gray-400">
            <p className="mb-2">An unexpected issue occurred with the random image loader.</p>
            <Button onClick={onCancel} variant="link">Cancel and return</Button>
        </div>
    );
};

export default RandomImageLoader; 