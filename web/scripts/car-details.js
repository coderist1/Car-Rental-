// Simple client-side editing behavior for the car details page.
(function(){
  const qs = (s) => document.querySelector(s);
  const form = qs('#car-form');
  const editBtn = qs('#edit-btn');
  const saveBtn = qs('#save-btn');
  const saveNote = qs('#save-note');
  const image = qs('#car-image');
  const title = qs('#car-title');

  // sample initial data (could be replaced by query params or server data)
  const SAMPLE = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    price: 45.00,
    availability: 'available',
    description: 'Comfortable 4-seater, good on gas.',
    seats: 4,
    transmission: 'automatic',
    fuel: 'petrol',
    mileage: '15 km/l',
    features: ['AC','Bluetooth','GPS'],
    ownerName: 'John Doe',
    ownerContact: '+1 555 1234',
    minDays: 1,
    insurance: true,
    cancellation: 'Full refund 48h before pickup',
    rating: 4.6,
    reviews: [
      {author:'Alice', text:'Smooth ride, very clean.', score:5},
      {author:'Bob', text:'Fuel efficient, no issues.', score:4}
    ]
  };

  function setForm(data){
    form.make.value = data.make || '';
    form.model.value = data.model || '';
    form.year.value = data.year || '';
    form.price.value = data.price || '';
    form.availability.value = data.availability || 'available';
    form.description.value = data.description || '';
    // new fields
    form.seats && (form.seats.value = data.seats || '');
    form.transmission && (form.transmission.value = data.transmission || 'automatic');
    form.fuel && (form.fuel.value = data.fuel || 'petrol');
    form.mileage && (form.mileage.value = data.mileage || '');
    form.features && (form.features.value = (data.features && data.features.join ? data.features.join(', ') : (data.features || '')));
    form.ownerName && (form.ownerName.value = data.ownerName || '');
    form.ownerContact && (form.ownerContact.value = data.ownerContact || '');
    form.minDays && (form.minDays.value = data.minDays || 1);
    form.insurance && (form.insurance.checked = !!data.insurance);
    form.cancellation && (form.cancellation.value = data.cancellation || '');

    // display-only fields
    const ratingEl = document.getElementById('rating');
    const reviewsList = document.getElementById('reviews-list');
    ratingEl.textContent = data.rating ? data.rating.toFixed(1) : '—';
    if(reviewsList){
      if(data.reviews && data.reviews.length){
        reviewsList.innerHTML = data.reviews.map(r => `<div class="review"><strong>${r.author}</strong>: ${r.text} <span class="score">(${r.score}/5)</span></div>`).join('');
      } else {
        reviewsList.textContent = 'No reviews yet.';
      }
    }
    title.textContent = `${data.make || ''} ${data.model || ''}`.trim() || 'Car Model — Details';
    // set image if provided
    if (data.image) {
      image.src = data.image;
    } else {
      // keep placeholder if available
      image.src = image.src || '../assets/car-placeholder.jpg';
    }
  }

  function setReadonly(readonly){
    Array.from(form.elements).forEach(el => el.disabled = readonly);
    saveBtn.disabled = readonly;
    editBtn.disabled = !readonly ? true : false;
  }

  // initialize
  const stored = JSON.parse(localStorage.getItem('car-details') || 'null');
  setForm(stored || SAMPLE);
  setReadonly(true);

  editBtn.addEventListener('click', () => {
    setReadonly(false);
    saveNote.textContent = '';
  });

  saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const data = {
      make: form.make.value,
      model: form.model.value,
      year: form.year.value,
      price: form.price.value,
      availability: form.availability.value,
      description: form.description.value,
      seats: form.seats ? Number(form.seats.value) : undefined,
      transmission: form.transmission ? form.transmission.value : undefined,
      fuel: form.fuel ? form.fuel.value : undefined,
      mileage: form.mileage ? form.mileage.value : undefined,
      features: form.features ? form.features.value.split(',').map(s=>s.trim()).filter(Boolean) : [],
      ownerName: form.ownerName ? form.ownerName.value : '',
      ownerContact: form.ownerContact ? form.ownerContact.value : '',
      minDays: form.minDays ? Number(form.minDays.value) : 1,
      insurance: form.insurance ? !!form.insurance.checked : false,
      cancellation: form.cancellation ? form.cancellation.value : '',
      // keep existing rating/reviews if present
      rating: SAMPLE.rating || null,
      reviews: SAMPLE.reviews || []
    };
    // confirm with user before saving
    if (!window.confirm('Save changes to this vehicle?')) {
      saveNote.textContent = 'Save cancelled.';
      return;
    }

    // include currently shown image (could be objectURL or real URL)
    data.image = image.src;
    localStorage.setItem('car-details', JSON.stringify(data));
    setReadonly(true);
    saveNote.textContent = 'Saved locally.';
  });

  // allow clicking image to replace via file input (local preview only)
  image.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type='file'; input.accept='image/*';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if(!file) return;
      const url = URL.createObjectURL(file);
      image.src = url;
    };
    input.click();
    // ask user for permission before saving using custom modal if available
    showConfirm('Save changes to this vehicle?').then(ok=>{
      if(!ok){ saveNote.textContent = 'Save cancelled.'; return; }
      data.image = image.src;
      localStorage.setItem('car-details', JSON.stringify(data));
      setReadonly(true);
      saveNote.textContent = 'Saved locally.';
    });

  // Reusable showConfirm for this page (uses modal if present)
  function showConfirm(message){
    return new Promise(resolve=>{
      const modal = document.getElementById('confirm-modal');
      const msg = document.getElementById('confirm-message');
      const yes = document.getElementById('confirm-yes');
      const no = document.getElementById('confirm-no');
      if(!modal || !msg || !yes || !no){
        resolve(window.confirm(message));
        return;
      }
      msg.textContent = message;
      modal.style.display = 'block';
      const cleanup = ()=>{
        modal.style.display = 'none';
        yes.removeEventListener('click', onYes);
        no.removeEventListener('click', onNo);
      };
      const onYes = ()=>{ cleanup(); resolve(true); };
      const onNo = ()=>{ cleanup(); resolve(false); };
      yes.addEventListener('click', onYes);
      no.addEventListener('click', onNo);
    });
  }
