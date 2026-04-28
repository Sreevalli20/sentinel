// Create a new helper file: `emailService.ts`
export const sendEmailToAbsentees = (absentees: any[]) => {
    absentees.forEach((student) => {
      fetch('/api/send-email', {  // Update this line to /api/send-email
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          absentees: [student],
        }),
      }).then(response => {
        if (!response.ok) {
          console.error('Failed to send email to absentee');
        }
      });
    });
};