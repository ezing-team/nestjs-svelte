<script>
    import { onMount } from "svelte";
    import SchoolEditor from "./SchoolEditor.svelte";

    import SchoolList from "./SchoolList.svelte";

    const endPoint = "http://localhost:3000";
    let schools = [];
    let currentSchool;

    onMount(async () => {
        await loadSchoolData();
    });

    async function loadSchoolData() {
        await fetch(`${endPoint}/school/findAll`)
            .then((r) => r.json())
            .then((data) => {
                currentSchool = null;
                schools = data;
            });
    }

    function createSchool() {
        fetch(`${endPoint}/school/create`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(currentSchool),
        }).then(loadSchoolData);
    }

    function updateSchool() {
        fetch(`${endPoint}/school/update/${currentSchool.id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },

            body: JSON.stringify(currentSchool),
        }).then(loadSchoolData);
    }

    function deleteSchool(param) {
        fetch(`${endPoint}/school/delete/${param.detail}`, {
            method: "DELETE",
        }).then(loadSchoolData);
    }

    function onSchoolSelected(param) {
        if (!param.detail) {
            currentSchool = {
                id: "",
                name: "",
                city: "",
                country: "",
            };

            return;
        }

        currentSchool = schools.find((s) => s.id === param.detail.id);
    }

    function onSchoolDataChanged(param) {
        currentSchool = Object.assign(currentSchool, param.detail);
        console.log(currentSchool);
    }

    function onCancel() {
        currentSchool = null;
    }

    function onSave() {
        if (!currentSchool.id) {
            return createSchool();
        }

        updateSchool();
    }
</script>

<SchoolList
    {schools}
    on:onItemSelected={onSchoolSelected}
    on:onDeleteItem={deleteSchool}
/>

{#if currentSchool}
    <SchoolEditor
        school={currentSchool}
        on:onSchoolDataChanged={onSchoolDataChanged}
    />
    <section class="button-wrapper">
        <div class="button-row">
            <input type="button" value="Cancel" on:click={onCancel} />
        </div>

        <div class="button-row">
            <input type="button" value="Save" on:click={onSave} />
        </div>
    </section>
{/if}

<style>
    .button-wrapper {
        display: flex;
    }

    .button-row {
        width: 50%;
        padding: 5px;
    }

    .button-row input[type="button"] {
        width: 100%;
    }
</style>
