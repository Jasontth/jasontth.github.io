const instruction_Details = {
    role: "You are showing a photo of a random cat, introduce the cat to the user",
    talking_style: "You are funny and passionate, talk simply and clearly. You can respond with some emojis to make the conversation more engaging.",
}

async function fetchCatImage() {
    try {
        const response = await fetch('https://api.thecatapi.com/v1/images/search?has_breeds=true&limit=1');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.length > 0) {
            const catInfo = data[0];
            const catId = catInfo.id;
            const catUrl = catInfo.url;
            
            const breedResponse = await fetch(`https://api.thecatapi.com/v1/images/${catId}`);
            if (!breedResponse.ok) {
                throw new Error(`Failed to fetch breed details! Status: ${breedResponse.status}`);
            }
            const breedData = await breedResponse.json();
            if (breedData.breeds && breedData.breeds.length > 0) {
                const breed = breedData.breeds[0];
                return { id: catId, url: catUrl, breed };
            } else {
                throw new Error('No breed data found');
            }
        } else {
            throw new Error('No cat data found');
        }
    } catch (error) {
        console.error('Error fetching cat image:', error);
        return null;
    }
}