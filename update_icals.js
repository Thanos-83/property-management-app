const fs = require('fs');
const path = require('path');

const directory = path.join(process.cwd(), 'public', 'icals');

// Helper to format date as YYYYMMDD
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

// Helper to add days to a date
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Helper to get random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Create VEVENT block
function createEvent(uidSuffix, startDate, endDate, summary = "Reserved") {
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `BEGIN:VEVENT
UID:generated-${uidSuffix}
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${formatDate(startDate)}
DTEND;VALUE=DATE:${formatDate(endDate)}
SUMMARY:${summary}
DESCRIPTION:Generated for Testing
END:VEVENT`;
}

function isHighSeason(date) {
    const month = date.getMonth(); // 0-11
    // High season: June(5), July(6), August(7) AND Dec(11), Jan(0)
    return (month >= 5 && month <= 7) || month === 11 || month === 0;
}

function generateEvents() {
    let count = 0;
    const files = fs.readdirSync(directory);

    files.forEach(filename => {
        if (filename.includes('_') && filename.endsWith('.ics')) {
            const filepath = path.join(directory, filename);
            console.log(`Updating ${filename}...`);

            let content = fs.readFileSync(filepath, 'utf8');

            // Remove END:VCALENDAR to append
            if (content.includes('END:VCALENDAR')) {
                content = content.replace('END:VCALENDAR', '');
            }

            // Start simulation from Feb 14, 2026
            let currentDate = new Date('2026-02-14');
            const endDateLimit = new Date('2026-11-01'); // Go until end of Oct

            let eventCount = 0;

            while (currentDate < endDateLimit) {
                const highSeason = isHighSeason(currentDate);
                
                // Determine probability of booking starting today (or after a gap)
                // We simplify: always add a gap, then maybe define a booking.
                
                // Gap logic
                let gapDays;
                if (highSeason) {
                    gapDays = getRandomInt(0, 3);
                } else {
                    gapDays = getRandomInt(3, 10);
                }

                currentDate = addDays(currentDate, gapDays);

                if (currentDate >= endDateLimit) break;

                // Probability check to book
                const shouldBook = Math.random() < (highSeason ? 0.9 : 0.5); // Slightly tweaked probabilities

                if (shouldBook) {
                    let stayLength;
                    if (highSeason) {
                        stayLength = getRandomInt(4, 14);
                    } else {
                        stayLength = getRandomInt(2, 5);
                    }

                    const bookingStart = new Date(currentDate);
                    const bookingEnd = addDays(bookingStart, stayLength);

                    const uid = `${filename}-${formatDate(bookingStart)}`;
                    const eventBlock = createEvent(uid, bookingStart, bookingEnd);
                    
                    content += eventBlock + '\n';
                    eventCount++;
                    
                    // Advance current date to end of booking
                    currentDate = bookingEnd;
                } else {
                    // If not booking, just advance a day to re-evaluate or just leave the gap
                    // To avoid infinite loops of gaps, let's just jump a bit more if we didn't book
                    currentDate = addDays(currentDate, 1);
                }
            }

            content += 'END:VCALENDAR\n';
            fs.writeFileSync(filepath, content);
            console.log(`  Added ${eventCount} events.`);
            count++;
        }
    });

    console.log(`Updated ${count} files.`);
}

generateEvents();
