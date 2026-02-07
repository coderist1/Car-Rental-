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
    description: 'Comfortable 4-seater, good on gas.'
  };

  function setForm(data){
    form.make.value = data.make || '';
    form.model.value = data.model || '';
    form.year.value = data.year || '';
    form.price.value = data.price || '';
    form.availability.value = data.availability || 'available';
    form.description.value = data.description || '';
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
      description: form.description.value
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
  });
})();
