// Tags utility functions for member management

const TagsUI = {
  // Fetch all tags for the organization
  async fetchTags() {
    const response = await fetch('/api/tags');
    if (!response.ok) throw new Error('Failed to fetch tags');
    const data = await response.json();
    return data.tags;
  },

  // Render tag badges for a member
  renderTags(member, container) {
    if (!member.tags || member.tags.length === 0) {
      container.innerHTML = '<span style="color:var(--gray-400);font-size:12px;">No tags</span>';
      return;
    }

    container.innerHTML = member.tags.map(tag => `
      <span class="tag-badge" style="background:${tag.color}20;color:${tag.color};display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:12px;font-size:11px;margin:2px;">
        ${tag.name}
        <button onclick="TagsUI.removeTag('${member.id}', '${tag.id}')" style="background:none;border:none;cursor:pointer;padding:0 2px;opacity:0.7;color:inherit;" title="Remove tag">×</button>
      </span>
    `).join('');
  },

  // Add tag to member
  async addTag(memberId, tagId) {
    const response = await fetch(`/api/members/${memberId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagIds: [tagId] })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to add tag');
    }

    return response.json();
  },

  // Remove tag from member
  async removeTag(memberId, tagId) {
    if (!confirm('Remove this tag?')) return;

    const response = await fetch(`/api/members/${memberId}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagIds: [tagId] })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to remove tag');
    }

    // Reload members list
    if (typeof loadMembers === 'function') {
      loadMembers();
    }
  },

  // Show tag selector dropdown for a member
  async showTagSelector(memberId, allTags, memberTags, targetElement) {
    const memberTagIds = memberTags.map(t => t.id);
    const availableTags = allTags.filter(t => !memberTagIds.includes(t.id));

    if (availableTags.length === 0) {
      alert('No more tags available');
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position:absolute;background:white;border:1px solid var(--border-color);border-radius:8px;padding:8px;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-height:200px;overflow-y:auto;min-width:150px;';

    dropdown.innerHTML = availableTags.map(tag => `
      <button onclick="TagsUI.handleAddTag('${memberId}', '${tag.id}', this.parentElement)"
              style="display:block;width:100%;text-align:left;padding:6px 10px;border:none;background:none;cursor:pointer;border-radius:4px;margin:2px 0;font-size:13px;">
        <span style="background:${tag.color}20;color:${tag.color};padding:2px 8px;border-radius:12px;font-size:11px;">${tag.name}</span>
      </button>
    `).join('');

    // Position near target element
    const rect = targetElement.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;

    // Remove on click outside
    const removeDropdown = (e) => {
      if (!dropdown.contains(e.target) && e.target !== targetElement) {
        dropdown.remove();
        document.removeEventListener('click', removeDropdown);
      }
    };
    setTimeout(() => document.addEventListener('click', removeDropdown), 100);

    document.body.appendChild(dropdown);
  },

  // Handle add tag with dropdown removal
  async handleAddTag(memberId, tagId, dropdown) {
    try {
      await TagsUI.addTag(memberId, tagId);
      dropdown.remove();

      // Reload members list
      if (typeof loadMembers === 'function') {
        loadMembers();
      }
    } catch (err) {
      alert(err.message);
    }
  }
};
