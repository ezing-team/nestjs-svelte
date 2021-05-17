<script>
    import { createEventDispatcher } from "svelte";
    export let school;

    const dispatch = createEventDispatcher();

    const onSchoolDataChangedHandler = (data) => {
        dispatch("onSchoolDataChanged", data);
    };

    function onSchoolDataChanged(e) {
        const changedData = {};

        changedData[e.target.id] = e.target.value;
        onSchoolDataChangedHandler(changedData);
    }
</script>

<section class="school-editor">
    <div class="school-editor__input">
        <input
            id="name"
            type="text"
            placeholder="Enter school name"
            value={school ? school.name : ""}
            on:input={onSchoolDataChanged}
        />
    </div>
    <div class="school-editor__input">
        <input
            id="city"
            type="text"
            placeholder="Enter city"
            value={school ? school.city : ""}
            on:input={onSchoolDataChanged}
        />
    </div>
    <div class="school-editor__input">
        <input
            id="country"
            type="text"
            placeholder="Enter country"
            value={school ? school.country : ""}
            on:input={onSchoolDataChanged}
        />
    </div>
</section>

<style>
    .school-editor {
        margin-top: 20px;
        width: 100%;
        padding: 5px;
        border: 1px solid gray;
    }

    .school-editor__input input {
        width: 100%;
    }
</style>
