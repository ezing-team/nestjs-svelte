<script>
    import { createEventDispatcher } from "svelte";
    export let schools;

    const dispatch = createEventDispatcher();

    const onItemSelectedEventHandler = (data) => {
        dispatch("onItemSelected", data);
    };

    const onDeleteSchoolEventHandler = (schoolId) => {
        dispatch("onDeleteItem", schoolId);
    };

    function onItemClicked(selectedSchool) {
        onItemSelectedEventHandler(selectedSchool);
    }

    function onDeleteSchool(e, schoolId) {
        e.stopPropagation();
        onDeleteSchoolEventHandler(schoolId);
    }
</script>

<section class="school-list">
    <div class="school-list__item header">
        <div class="school-list__item__cell">School name</div>
        <div class="school-list__item__cell">City</div>
        <div class="school-list__item__cell">Country</div>
        <div class="school-list__item__cell">Action</div>
    </div>
    {#each schools as school, i}
        <div class="school-list__item" on:click={() => onItemClicked(school)}>
            <div class="school-list__item__cell">{school.name}</div>
            <div class="school-list__item__cell">{school.city}</div>
            <div class="school-list__item__cell">{school.country}</div>
            <div class="school-list__item__cell">
                <span on:click={(e) => onDeleteSchool(e, school.id)}
                    >Delete</span
                >
            </div>
        </div>
    {/each}
    <div class="add-new-school" on:click={() => onItemClicked()}>Add new</div>
</section>

<style>
    .school-list__item {
        display: flex;
        width: 100%;
        padding: 5px;
        border: 1px solid green;
    }

    .school-list__item.header {
        background: green;
        color: white;
    }

    .school-list__item:hover {
        background: pink;
    }

    .school-list__item.header:hover {
        background: green;
    }

    .school-list__item span {
        background: red;
        padding: 3px;
        color: white;
        border-radius: 3px;
        border: 1px solid black;
    }

    .school-list__item span:hover {
        cursor: pointer;
        background: rgb(236, 90, 90);
    }

    .school-list__item__cell {
        width: 33%;
    }

    .add-new-school {
        margin: 5px;
        border: 1px solid gray;
        background: gray;
        color: white;
        padding: 5px;
    }

    .add-new-school:hover {
        background: black;
    }
</style>
