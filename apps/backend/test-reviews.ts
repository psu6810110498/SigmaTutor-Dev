async function testApi() {
  console.log('Fetching courses...');
  const coursesRes = await fetch('http://localhost:4000/api/v1/courses');
  const coursesData = await coursesRes.json();
  
  if (!coursesData.data || coursesData.data.courses.length === 0) {
    console.log('No courses found.');
    return;
  }
  
  const courseId = coursesData.data.courses[0].id;
  console.log(`Using courseId: ${courseId}`);
  
  console.log('Fetching reviews...');
  const reviewRes = await fetch(`http://localhost:4000/api/v1/reviews?courseId=${courseId}`);
  const reviewData = await reviewRes.json();
  
  console.log(JSON.stringify(reviewData, null, 2));
}

testApi().catch(console.error);
